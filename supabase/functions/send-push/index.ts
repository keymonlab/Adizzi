import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PushMessage {
  recipient_ids: string[]
  title: string
  body: string
  data?: Record<string, string>
}

interface ExpoMessage {
  to: string
  sound: 'default'
  title: string
  body: string
  data: Record<string, string>
}

interface ExpoResponse {
  data: Array<{
    id?: string
    status: 'ok' | 'error'
    message?: string
  }>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: PushMessage = await req.json()
    const { recipient_ids, title, body: messageBody, data } = body

    // Validate required fields
    if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'recipient_ids must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!title || typeof title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'title is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!messageBody || typeof messageBody !== 'string') {
      return new Response(
        JSON.stringify({ error: 'body is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch push tokens for given recipient IDs
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, push_token')
      .in('id', recipient_ids)

    if (queryError) {
      console.error('Database error:', queryError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter out null/empty tokens
    const tokens = (users || [])
      .filter((user): user is { id: string; push_token: string } => user.push_token !== null && user.push_token !== '')
      .map((user) => user.push_token)

    // Handle empty token list gracefully
    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: 'No valid push tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build Expo messages
    const messages: ExpoMessage[] = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body: messageBody,
      data: data || {},
    }))

    // Send to Expo Push API
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!expoResponse.ok) {
      const errorText = await expoResponse.text()
      console.error('Expo API error:', expoResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send push notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const expoData: ExpoResponse = await expoResponse.json()

    // Process response tickets and count successes/failures
    let sent = 0
    let failed = 0

    if (expoData.data && Array.isArray(expoData.data)) {
      expoData.data.forEach((ticket, index) => {
        if (ticket.status === 'ok') {
          sent++
        } else {
          failed++
          console.warn(`Push notification failed for token ${tokens[index]}: ${ticket.message || 'Unknown error'}`)
        }
      })
    }

    return new Response(
      JSON.stringify({ sent, failed, total: tokens.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
