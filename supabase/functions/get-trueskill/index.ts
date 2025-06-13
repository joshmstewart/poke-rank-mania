
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
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Edge Function getTrueSkill] Fetching data for sessionId: ${sessionId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('trueskill_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[Edge Function getTrueSkill] No data found for sessionId: ${sessionId}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            ratings: {},
            totalBattles: 0,
            totalBattlesLastUpdated: Date.now(),
            pendingBattles: [],
            refinementQueue: []
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.error('[Edge Function getTrueSkill] Supabase error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const ratingsCount = Object.keys(data.ratings_data || {}).length;
    console.log(`[Edge Function getTrueSkill] Found data with ${ratingsCount} ratings, ${data.total_battles || 0} total battles, ${(data.pending_battles || []).length} pending battles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ratings: data.ratings_data || {},
        totalBattles: data.total_battles || 0,
        totalBattlesLastUpdated: data.total_battles_last_updated || Date.now(),
        pendingBattles: data.pending_battles || [],
        refinementQueue: data.refinement_queue || []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Edge Function getTrueSkill] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
