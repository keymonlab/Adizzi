import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MatchRequest {
  post_id: string
}

interface Post {
  id: string
  neighborhood_id: string
  category: string
  title: string
  description: string
  author_id: string
}

interface LostAlert {
  id: string
  user_id: string
  neighborhood_id: string
  category: string
  keywords: string[]
  active: boolean
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
    const body: MatchRequest = await req.json()
    const { post_id } = body

    if (!post_id || typeof post_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'post_id is required and must be a string' }),
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

    // Fetch the post by post_id
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, neighborhood_id, category, title, description, author_id')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      console.error('Failed to fetch post:', postError)
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const typedPost = post as Post

    // Query active lost_alerts matching neighborhood and category
    const { data: alerts, error: alertsError } = await supabase
      .from('lost_alerts')
      .select('id, user_id, neighborhood_id, category, keywords, active')
      .eq('neighborhood_id', typedPost.neighborhood_id)
      .eq('category', typedPost.category)
      .eq('active', true)

    if (alertsError) {
      console.error('Failed to fetch lost alerts:', alertsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch lost alerts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ matched: 0, notified: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build searchable text from post
    const searchText = `${typedPost.title} ${typedPost.description}`.toLowerCase()

    // Find alerts where any keyword matches post title or description
    const matchingAlerts = (alerts as LostAlert[]).filter((alert) => {
      if (!alert.keywords || alert.keywords.length === 0) return false
      return alert.keywords.some((keyword) =>
        searchText.includes(keyword.toLowerCase())
      )
    })

    if (matchingAlerts.length === 0) {
      return new Response(
        JSON.stringify({ matched: 0, notified: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Collect unique recipient user IDs (exclude the post author)
    const recipientIds = [
      ...new Set(
        matchingAlerts
          .map((alert) => alert.user_id)
          .filter((userId) => userId !== typedPost.author_id)
      ),
    ]

    // Create notifications for each matching alert owner
    const notifications = recipientIds.map((userId) => ({
      type: 'lost_alert_match',
      recipient_id: userId,
      actor_id: typedPost.author_id,
      post_id: typedPost.id,
      read: false,
    }))

    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notifError) {
        console.error('Failed to insert notifications:', notifError)
        // Non-fatal: continue to push notification attempt
      }
    }

    // Send push notifications via send-push function
    let notified = 0
    if (recipientIds.length > 0) {
      try {
        const { error: pushError } = await supabase.functions.invoke('send-push', {
          body: {
            recipient_ids: recipientIds,
            title: '분실물 알림 매칭',
            body: `"${typedPost.title}" 게시물이 회원님의 분실물 알림과 일치합니다.`,
            data: {
              type: 'lost_alert_match',
              post_id: typedPost.id,
            },
          },
        })

        if (pushError) {
          console.error('Failed to send push notifications:', pushError)
        } else {
          notified = recipientIds.length
        }
      } catch (pushErr) {
        console.error('Push notification invocation error:', pushErr)
      }
    }

    return new Response(
      JSON.stringify({ matched: matchingAlerts.length, notified }),
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
