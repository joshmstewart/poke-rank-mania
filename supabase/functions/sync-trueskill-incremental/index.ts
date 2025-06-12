
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
    const { 
      sessionId, 
      changedRatings, 
      pendingBattles, 
      totalBattles,
      localStateVersion,
      lastUpdated 
    } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Edge Function syncTrueSkillIncremental] Processing incremental sync for sessionId: ${sessionId}`);
    console.log(`[Edge Function syncTrueSkillIncremental] Changed ratings: ${changedRatings ? Object.keys(changedRatings).length : 0}`);
    console.log(`[Edge Function syncTrueSkillIncremental] Pending battles: ${pendingBattles ? pendingBattles.length : 'unchanged'}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, get the current data from the database
    const { data: currentData, error: fetchError } = await supabase
      .from('trueskill_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    let updatedRatings = currentData?.ratings_data || {};
    let updatedPending = currentData?.pending_battles || [];
    let updatedTotalBattles = currentData?.total_battles || 0;

    // Apply incremental changes to ratings
    if (changedRatings) {
      console.log(`[Edge Function syncTrueSkillIncremental] Merging ${Object.keys(changedRatings).length} changed ratings into existing ${Object.keys(updatedRatings).length} ratings`);
      updatedRatings = { ...updatedRatings, ...changedRatings };
      console.log(`[Edge Function syncTrueSkillIncremental] After merge: ${Object.keys(updatedRatings).length} total ratings`);
    }

    // Update pending battles if provided
    if (pendingBattles !== undefined) {
      console.log(`[Edge Function syncTrueSkillIncremental] Updating pending battles from ${updatedPending.length} to ${pendingBattles.length}`);
      updatedPending = pendingBattles;
    }

    // Update total battles if provided
    if (totalBattles !== undefined) {
      console.log(`[Edge Function syncTrueSkillIncremental] Updating total battles from ${updatedTotalBattles} to ${totalBattles}`);
      updatedTotalBattles = totalBattles;
    }

    // Upsert the merged data
    const { data, error } = await supabase
      .from('trueskill_sessions')
      .upsert({
        session_id: sessionId,
        ratings_data: updatedRatings,
        total_battles: updatedTotalBattles,
        pending_battles: updatedPending,
        last_updated: lastUpdated || new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })
      .select();

    if (error) {
      console.error('[Edge Function syncTrueSkillIncremental] Supabase error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Edge Function syncTrueSkillIncremental] Successfully synced incremental data for sessionId: ${sessionId}`);
    console.log(`[Edge Function syncTrueSkillIncremental] Final state: ${Object.keys(updatedRatings).length} ratings, ${updatedPending.length} pending, ${updatedTotalBattles} total battles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        finalRatingsCount: Object.keys(updatedRatings).length,
        finalPendingCount: updatedPending.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Edge Function syncTrueSkillIncremental] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
