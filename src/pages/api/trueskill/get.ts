
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID is required'
      });
    }

    console.log(`[API trueskill/get] Loading data for sessionId: ${sessionId}`);

    // Use the existing Supabase edge function for actual retrieval
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-trueskill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    const result = await response.json();
    
    console.log(`[API trueskill/get] Retrieved data for sessionId: ${sessionId}`);
    return res.status(200).json(result);

  } catch (error) {
    console.error('[API trueskill/get] Load error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error'
    });
  }
}
