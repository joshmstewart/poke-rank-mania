
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
    const { sessionId, ratings, lastUpdated } = await req.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Session ID is required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!ratings || typeof ratings !== 'object') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Ratings data is required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Edge Function syncTrueSkill] Syncing data for sessionId: ${sessionId} with ${Object.keys(ratings).length} ratings`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from('trueskill_sessions')
      .update({
        ratings_data: ratings,
        last_updated: lastUpdated || new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('[Edge Function syncTrueSkill] Update error:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database update error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If no record was updated, create a new one
    if (!updateData) {
      console.log(`[Edge Function syncTrueSkill] No existing record found, creating new one for sessionId: ${sessionId}`);
      
      const { error: insertError } = await supabase
        .from('trueskill_sessions')
        .insert({
          session_id: sessionId,
          ratings_data: ratings,
          last_updated: lastUpdated || new Date().toISOString()
        });

      if (insertError) {
        console.error('[Edge Function syncTrueSkill] Insert error:', insertError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Database insert error'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    console.log(`[Edge Function syncTrueSkill] Successfully synced data for sessionId: ${sessionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data synced successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Edge Function syncTrueSkill] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
