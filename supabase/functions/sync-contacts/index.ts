import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_CONTACTS = 500

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

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '')
  // Korean number without country code
  if (cleaned.startsWith('010')) {
    cleaned = '+82' + cleaned.substring(1)
  }
  // Already has +82 — return as-is
  if (cleaned.startsWith('+82')) {
    return cleaned
  }
  // Return as-is for other formats
  return cleaned
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
  let contacts: Array<{ phone: string; name: string }>
  try {
    const body = await req.json()
    if (!Array.isArray(body.contacts)) {
      return jsonResponse({ error: 'contacts must be an array' }, 400)
    }
    contacts = body.contacts
    if (contacts.length === 0) {
      return jsonResponse({ error: 'contacts array must not be empty' }, 400)
    }
    if (contacts.length > MAX_CONTACTS) {
      return jsonResponse({ error: `Maximum ${MAX_CONTACTS} contacts per sync` }, 400)
    }
    for (const c of contacts) {
      if (typeof c.phone !== 'string' || typeof c.name !== 'string') {
        return jsonResponse({ error: 'Each contact must have string phone and name fields' }, 400)
      }
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const hmacSecretKey = Deno.env.get('HMAC_SECRET_KEY')!

  // Verify user via anon client
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: { user }, error: authError } = await anonClient.auth.getUser()
  if (authError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const callerId = user.id

  // Service-role client for privileged DB access
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  // Hash all phone numbers
  const hashToContact = new Map<string, { phone: string; name: string }>()
  for (const contact of contacts) {
    const normalized = normalizePhone(contact.phone)
    if (!normalized) continue
    const hash = await hmacSha256(hmacSecretKey, normalized)
    // Last contact with this hash wins (dedup)
    hashToContact.set(hash, contact)
  }

  const hashes = Array.from(hashToContact.keys())
  if (hashes.length === 0) {
    return jsonResponse({ matches: [] })
  }

  // Query phone_hashes for matching entries
  const { data: phoneHashRows, error: hashQueryError } = await adminClient
    .from('phone_hashes')
    .select('user_id, phone_hash')
    .in('phone_hash', hashes)

  if (hashQueryError) {
    console.error('phone_hashes query error:', hashQueryError)
    return jsonResponse({ error: 'Failed to query phone hashes' }, 500)
  }

  if (!phoneHashRows || phoneHashRows.length === 0) {
    return jsonResponse({ matches: [] })
  }

  // Collect matched user ids (skip self)
  const matchedUserIds: string[] = []
  const userIdToContactName = new Map<string, string>()

  for (const row of phoneHashRows) {
    if (row.user_id === callerId) continue
    const contact = hashToContact.get(row.phone_hash)
    if (!contact) continue
    matchedUserIds.push(row.user_id)
    userIdToContactName.set(row.user_id, contact.name)
  }

  if (matchedUserIds.length === 0) {
    return jsonResponse({ matches: [] })
  }

  // Upsert contacts_matches for each matched user
  const now = new Date().toISOString()
  const upsertRows = matchedUserIds.map((matchedUserId) => ({
    user_id: callerId,
    matched_user_id: matchedUserId,
    contact_name: userIdToContactName.get(matchedUserId)!,
    updated_at: now,
  }))

  const { error: upsertError } = await adminClient
    .from('contacts_matches')
    .upsert(upsertRows, { onConflict: 'user_id,matched_user_id' })

  if (upsertError) {
    console.error('contacts_matches upsert error:', upsertError)
    return jsonResponse({ error: 'Failed to save contact matches' }, 500)
  }

  // Fetch profile data for matched users
  const { data: profiles, error: profilesError } = await adminClient
    .from('users')
    .select('id, display_name, handle, avatar_url')
    .in('id', matchedUserIds)

  if (profilesError) {
    console.error('users query error:', profilesError)
    return jsonResponse({ error: 'Failed to fetch matched profiles' }, 500)
  }

  const matches = (profiles ?? []).map((profile) => ({
    user_id: profile.id,
    display_name: profile.display_name,
    handle: profile.handle,
    avatar_url: profile.avatar_url,
    contact_name: userIdToContactName.get(profile.id)!,
  }))

  return jsonResponse({ matches })
})
