
import { supabase } from '@/integrations/supabase/client';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { sessionId, ratings, lastUpdated } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Session ID is required'
    });
  }

  if (!ratings || typeof ratings !== 'object') {
    return res.status(400).json({ 
      success: false, 
      error: 'Ratings data is required'
    });
  }

  try {
    console.log(`[API syncTrueSkill] Syncing data for sessionId: ${sessionId} with ${Object.keys(ratings).length} ratings`);

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
      console.error('[API syncTrueSkill] Update error:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Database update error'
      });
    }

    // If no record was updated, create a new one
    if (!updateData) {
      console.log(`[API syncTrueSkill] No existing record found, creating new one for sessionId: ${sessionId}`);
      
      const { error: insertError } = await supabase
        .from('trueskill_sessions')
        .insert({
          session_id: sessionId,
          ratings_data: ratings,
          last_updated: lastUpdated || new Date().toISOString()
        });

      if (insertError) {
        console.error('[API syncTrueSkill] Insert error:', insertError);
        return res.status(500).json({ 
          success: false, 
          error: 'Database insert error'
        });
      }
    }

    console.log(`[API syncTrueSkill] Successfully synced data for sessionId: ${sessionId}`);

    return res.status(200).json({
      success: true,
      message: 'Data synced successfully'
    });

  } catch (error) {
    console.error('[API syncTrueSkill] Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error'
    });
  }
}
