
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionId, ratings, totalBattles, lastUpdated } = req.body;

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

    console.log(`[API trueskill/sync] Syncing data for sessionId: ${sessionId} with ${Object.keys(ratings).length} ratings, ${totalBattles || 0} total battles`);

    // Use the existing Supabase edge function for actual storage
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-trueskill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        sessionId,
        ratings,
        totalBattles: totalBattles || 0,
        lastUpdated: lastUpdated || new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`[API trueskill/sync] Successfully synced data for sessionId: ${sessionId}`);
      return res.status(200).json({
        success: true,
        message: 'Data synced successfully'
      });
    } else {
      throw new Error(result.error || 'Unknown sync error');
    }

  } catch (error) {
    console.error('[API trueskill/sync] Sync error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error'
    });
  }
}
