
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { sessionId, ratings, totalBattles, pendingBattles, lastUpdated } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Edge Function syncTrueSkill] Syncing sessionId: ${sessionId} with ${Object.keys(ratings || {}).length} ratings, ${totalBattles || 0} battles, ${(pendingBattles || []).length} pending battles`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Upsert the session data
    const { data, error } = await supabase
      .from('trueskill_sessions')
      .upsert({
        session_id: sessionId,
        ratings_data: ratings || {},
        total_battles: totalBattles || 0,
        pending_battles: pendingBattles || [],
        last_updated: lastUpdated || new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })
      .select();

    if (error) {
      console.error('[Edge Function syncTrueSkill] Supabase error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Edge Function syncTrueSkill] Successfully synced data for sessionId: ${sessionId}`);

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Edge Function syncTrueSkill] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
