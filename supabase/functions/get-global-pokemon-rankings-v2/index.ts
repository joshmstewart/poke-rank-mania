
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GlobalRanking {
  pokemonId: number;
  name: string;
  image: string;
  generationId: number;
  types: string[];
  globalRank: number;
  averageScore: number;
  usersRankedCount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse query parameters
    const url = new URL(req.url);
    const generationFilter = url.searchParams.get('generation');
    const minUsersFilter = parseInt(url.searchParams.get('minUsers') || '1');

    console.log('🌍 [GLOBAL_RANKINGS_V2] Fetching global rankings...');
    console.log('🌍 [GLOBAL_RANKINGS_V2] Generation filter:', generationFilter);
    console.log('🌍 [GLOBAL_RANKINGS_V2] Min users filter:', minUsersFilter);

    // Get all TrueSkill sessions with ratings data
    const { data: sessions, error: sessionsError } = await supabase
      .from('trueskill_sessions')
      .select('ratings_data')
      .not('ratings_data', 'eq', '{}');

    if (sessionsError) {
      console.error('🌍 [GLOBAL_RANKINGS_V2] Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    console.log('🌍 [GLOBAL_RANKINGS_V2] Found sessions:', sessions?.length || 0);

    // Aggregate ratings across all sessions
    const pokemonStats: Record<number, { scores: number[], userIds: Set<string> }> = {};

    sessions?.forEach(session => {
      const ratingsData = session.ratings_data as Record<string, any>;
      
      Object.entries(ratingsData).forEach(([pokemonId, rating]) => {
        const id = parseInt(pokemonId);
        if (!pokemonStats[id]) {
          pokemonStats[id] = { scores: [], userIds: new Set() };
        }
        
        // Add score if the Pokemon has been in battles
        if (rating.battleCount > 0) {
          pokemonStats[id].scores.push(rating.mu - 3 * rating.sigma);
          pokemonStats[id].userIds.add(session.user_id);
        }
      });
    });

    console.log('🌍 [GLOBAL_RANKINGS_V2] Aggregated stats for Pokemon count:', Object.keys(pokemonStats).length);

    // Calculate global rankings
    const globalRankings: GlobalRanking[] = [];
    
    Object.entries(pokemonStats).forEach(([pokemonId, stats]) => {
      const id = parseInt(pokemonId);
      const usersRankedCount = stats.userIds.size;
      
      // Filter by minimum users
      if (usersRankedCount >= minUsersFilter) {
        const averageScore = stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length;
        
        globalRankings.push({
          pokemonId: id,
          name: `Pokemon ${id}`, // Will be updated with actual data
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
          generationId: Math.ceil(id / 151), // Rough generation calculation
          types: [],
          globalRank: 0, // Will be set after sorting
          averageScore,
          usersRankedCount
        });
      }
    });

    // Sort by average score (descending) and assign ranks
    globalRankings.sort((a, b) => b.averageScore - a.averageScore);
    globalRankings.forEach((ranking, index) => {
      ranking.globalRank = index + 1;
    });

    // Apply generation filter if specified
    let filteredRankings = globalRankings;
    if (generationFilter && generationFilter !== 'all') {
      const genId = parseInt(generationFilter);
      filteredRankings = globalRankings.filter(r => r.generationId === genId);
    }

    console.log('🌍 [GLOBAL_RANKINGS_V2] Returning rankings count:', filteredRankings.length);

    return new Response(
      JSON.stringify({ 
        rankings: filteredRankings.slice(0, 1000), // Limit to 1000 for performance
        totalCount: filteredRankings.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('🌍 [GLOBAL_RANKINGS_V2] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch global rankings' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
