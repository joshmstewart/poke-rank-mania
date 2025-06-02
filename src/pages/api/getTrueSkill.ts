
import { supabase } from '@/integrations/supabase/client';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Session ID is required',
      ratings: {}
    });
  }

  try {
    console.log(`[API getTrueSkill] Fetching data for sessionId: ${sessionId}`);

    const { data, error } = await supabase
      .from('trueskill_sessions')
      .select('ratings_data, last_updated')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('[API getTrueSkill] Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error',
        ratings: {}
      });
    }

    if (!data) {
      console.log(`[API getTrueSkill] No data found for sessionId: ${sessionId}`);
      return res.status(200).json({ 
        success: true, 
        ratings: {},
        lastUpdated: null
      });
    }

    console.log(`[API getTrueSkill] Found data with ${Object.keys(data.ratings_data || {}).length} ratings`);

    return res.status(200).json({
      success: true,
      ratings: data.ratings_data || {},
      lastUpdated: data.last_updated
    });

  } catch (error) {
    console.error('[API getTrueSkill] Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      ratings: {}
    });
  }
}
