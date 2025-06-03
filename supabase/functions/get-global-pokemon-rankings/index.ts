
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PokemonData {
  id: number;
  name: string;
  sprite_url: string;
  generation: number;
  types: string[];
}

interface GlobalRankingResult {
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
    console.log('Starting global rankings calculation...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get query parameters
    const url = new URL(req.url);
    const generation = url.searchParams.get('generation');
    const minUsers = parseInt(url.searchParams.get('minUsers') || '3');

    console.log(`Filtering: generation=${generation}, minUsers=${minUsers}`);

    // Fetch all TrueSkill sessions with ratings data
    const { data: sessions, error: sessionsError } = await supabase
      .from('trueskill_sessions')
      .select('ratings_data, user_id')
      .not('ratings_data', 'eq', '{}');

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    console.log(`Found ${sessions?.length || 0} sessions with ratings data`);

    // Aggregate ratings by Pokemon ID
    const pokemonRatings = new Map<number, { scores: number[], userIds: Set<string> }>();

    sessions?.forEach(session => {
      const ratingsData = session.ratings_data as Record<string, any>;
      
      Object.entries(ratingsData).forEach(([pokemonIdStr, ratingData]) => {
        const pokemonId = parseInt(pokemonIdStr);
        
        if (isNaN(pokemonId) || !ratingData || typeof ratingData.mu !== 'number') {
          return;
        }

        // Calculate conservative score (mu - 3*sigma)
        const mu = ratingData.mu || 25;
        const sigma = ratingData.sigma || 8.333;
        const score = mu - (3 * sigma);

        if (!pokemonRatings.has(pokemonId)) {
          pokemonRatings.set(pokemonId, { scores: [], userIds: new Set() });
        }

        const pokemonData = pokemonRatings.get(pokemonId)!;
        pokemonData.scores.push(score);
        pokemonData.userIds.add(session.user_id || 'anonymous');
      });
    });

    console.log(`Aggregated ratings for ${pokemonRatings.size} Pokemon`);

    // Calculate averages and filter by minimum users
    const aggregatedData = Array.from(pokemonRatings.entries())
      .map(([pokemonId, data]) => ({
        pokemonId,
        averageScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
        usersRankedCount: data.userIds.size
      }))
      .filter(item => item.usersRankedCount >= minUsers)
      .sort((a, b) => b.averageScore - a.averageScore);

    console.log(`${aggregatedData.length} Pokemon meet minimum user threshold`);

    // We need Pokemon data - for now, we'll create a basic structure
    // In a real implementation, you'd fetch this from your Pokemon data source
    const pokemonDataMap = new Map<number, PokemonData>();
    
    // Create basic Pokemon data structure for the aggregated Pokemon
    aggregatedData.forEach(item => {
      pokemonDataMap.set(item.pokemonId, {
        id: item.pokemonId,
        name: `Pokemon ${item.pokemonId}`, // Placeholder - you'd fetch real names
        sprite_url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemonId}.png`,
        generation: Math.ceil(item.pokemonId / 151), // Rough generation calculation
        types: ['unknown'] // Placeholder
      });
    });

    // Build final results
    const globalRankings: GlobalRankingResult[] = aggregatedData
      .map((item, index) => {
        const pokemonData = pokemonDataMap.get(item.pokemonId);
        if (!pokemonData) return null;

        return {
          pokemonId: item.pokemonId,
          name: pokemonData.name,
          image: pokemonData.sprite_url,
          generationId: pokemonData.generation,
          types: pokemonData.types,
          globalRank: index + 1,
          averageScore: Math.round(item.averageScore * 100) / 100,
          usersRankedCount: item.usersRankedCount
        };
      })
      .filter(item => item !== null) as GlobalRankingResult[];

    // Apply generation filter if specified
    const filteredRankings = generation 
      ? globalRankings.filter(pokemon => pokemon.generationId === parseInt(generation))
      : globalRankings;

    console.log(`Returning ${filteredRankings.length} global rankings`);

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredRankings,
        meta: {
          totalPokemon: filteredRankings.length,
          generationFilter: generation ? parseInt(generation) : null,
          minUsersFilter: minUsers
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in get-global-pokemon-rankings:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
