
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
      JSON.stringify({ success: false, error: 'Method not allowed', ratings: {}, totalBattles: 0 }),
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
        JSON.stringify({ 
          success: false, 
          error: 'Session ID is required',
          ratings: {},
          totalBattles: 0
        }),
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
      .select('ratings_data, total_battles, last_updated')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('[Edge Function getTrueSkill] Supabase error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database error',
          ratings: {},
          totalBattles: 0
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data) {
      console.log(`[Edge Function getTrueSkill] No data found for sessionId: ${sessionId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          ratings: {},
          totalBattles: 0,
          lastUpdated: null
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Edge Function getTrueSkill] Found data with ${Object.keys(data.ratings_data || {}).length} ratings, ${data.total_battles || 0} total battles`);

    return new Response(
      JSON.stringify({
        success: true,
        ratings: data.ratings_data || {},
        totalBattles: data.total_battles || 0,
        lastUpdated: data.last_updated
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Edge Function getTrueSkill] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        ratings: {},
        totalBattles: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
