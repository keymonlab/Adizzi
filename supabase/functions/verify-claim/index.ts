import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // Parse request body
  let post_id: string
  let answer: string
  try {
    const body = await req.json()
    post_id = body.post_id
    answer = body.answer
    if (!post_id || typeof post_id !== 'string') {
      return jsonResponse({ error: 'post_id is required' }, 400)
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  // Extract JWT from Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing or invalid Authorization header' }, 401)
  }
  const jwt = authHeader.replace('Bearer ', '')

  // Create anon client to verify the user's JWT
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const hmacSecretKey = Deno.env.get('HMAC_SECRET_KEY')!

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: { user }, error: authError } = await anonClient.auth.getUser()
  if (authError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const claimantId = user.id

  // Use service role client for privileged DB access
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  // Fetch the post (only fields needed for verification)
  const { data: post, error: postError } = await adminClient
    .from('posts')
    .select('id, author_id, verification_question, verification_answer_hash')
    .eq('id', post_id)
    .is('deleted_at', null)
    .single()

  if (postError || !post) {
    return jsonResponse({ error: 'Post not found' }, 404)
  }

  // Check existing claim for this user + post
  const { data: existingClaim } = await adminClient
    .from('claims')
    .select('id, status, failed_attempts')
    .eq('post_id', post_id)
    .eq('claimant_id', claimantId)
    .maybeSingle()

  if (existingClaim) {
    if (existingClaim.failed_attempts >= 3) {
      return jsonResponse({ error: 'Maximum attempts exceeded' }, 403)
    }
    if (existingClaim.status === 'verified') {
      return jsonResponse({ error: 'Already verified' }, 400)
    }
  }

  // No verification question: submit as pending and notify post author
  if (!post.verification_question) {
    const { error: upsertError } = await adminClient
      .from('claims')
      .upsert(
        {
          post_id,
          claimant_id: claimantId,
          status: 'pending',
          failed_attempts: existingClaim?.failed_attempts ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'post_id,claimant_id' },
      )

    if (upsertError) {
      console.error('Upsert claim error:', upsertError)
      return jsonResponse({ error: 'Failed to submit claim' }, 500)
    }

    // Notify post author
    await adminClient.from('notifications').insert({
      recipient_id: post.author_id,
      type: 'claim',
      post_id,
      actor_id: claimantId,
      read: false,
    })

    return jsonResponse({ status: 'pending', message: 'Claim submitted to post author' })
  }

  // Verification question exists: check the answer
  if (answer === undefined || answer === null || typeof answer !== 'string') {
    return jsonResponse({ error: 'answer is required when post has a verification question' }, 400)
  }

  const normalizedAnswer = answer.trim().toLowerCase()
  const isMatch = normalizedAnswer === (post.verification_answer_hash ?? '').trim().toLowerCase()

  if (isMatch) {
    const { error: upsertError } = await adminClient
      .from('claims')
      .upsert(
        {
          post_id,
          claimant_id: claimantId,
          status: 'verified',
          failed_attempts: existingClaim?.failed_attempts ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'post_id,claimant_id' },
      )

    if (upsertError) {
      console.error('Upsert verified claim error:', upsertError)
      return jsonResponse({ error: 'Failed to update claim' }, 500)
    }

    // Notify post author of verified claim
    await adminClient.from('notifications').insert({
      recipient_id: post.author_id,
      type: 'claim',
      post_id,
      actor_id: claimantId,
      read: false,
    })

    return jsonResponse({ status: 'verified', message: 'Answer matched. Claim verified.' })
  }

  // Answer did not match: increment failed_attempts
  const newFailedAttempts = (existingClaim?.failed_attempts ?? 0) + 1
  const remainingAttempts = Math.max(0, 3 - newFailedAttempts)

  const { error: upsertError } = await adminClient
    .from('claims')
    .upsert(
      {
        post_id,
        claimant_id: claimantId,
        status: existingClaim?.status ?? 'pending',
        failed_attempts: newFailedAttempts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'post_id,claimant_id' },
    )

  if (upsertError) {
    console.error('Upsert failed claim error:', upsertError)
    return jsonResponse({ error: 'Failed to record attempt' }, 500)
  }

  return jsonResponse(
    {
      error: 'Answer does not match',
      remaining_attempts: remainingAttempts,
    },
    400,
  )
})
