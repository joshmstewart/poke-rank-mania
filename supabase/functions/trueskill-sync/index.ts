
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      const { ratings, totalBattles, sessionId } = await req.json()

      console.log(`[TRUESKILL_SYNC] Syncing data for user ${user.id}`)
      console.log(`[TRUESKILL_SYNC] Total battles: ${totalBattles}`)
      console.log(`[TRUESKILL_SYNC] Session ID: ${sessionId}`)
      console.log(`[TRUESKILL_SYNC] Ratings count: ${Object.keys(ratings || {}).length}`)

      // Update or insert the TrueSkill data
      const { data, error } = await supabaseClient
        .from('trueskill_ratings')
        .upsert({
          user_id: user.id,
          session_id: sessionId,
          ratings: ratings,
          total_battles: totalBattles,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })

      if (error) {
        console.error('[TRUESKILL_SYNC] Database error:', error)
        return new Response(JSON.stringify({ error: 'Database error', details: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`[TRUESKILL_SYNC] Successfully synced data for user ${user.id}`)

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'GET') {
      // Retrieve TrueSkill data for the user
      const { data, error } = await supabaseClient
        .from('trueskill_ratings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('[TRUESKILL_SYNC] Database error:', error)
        return new Response(JSON.stringify({ error: 'Database error', details: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!data) {
        return new Response(JSON.stringify({ data: null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`[TRUESKILL_SYNC] Retrieved data for user ${user.id}`)

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[TRUESKILL_SYNC] Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
