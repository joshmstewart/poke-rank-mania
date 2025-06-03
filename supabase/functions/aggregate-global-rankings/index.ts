
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrueSkillRating {
  mu: number;
  sigma: number;
  battleCount: number;
}

interface TrueSkillSession {
  ratings_data: Record<string, TrueSkillRating>;
  total_battles: number;
  user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Use service role for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting global rankings aggregation...')

    // Get all TrueSkill sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('trueskill_sessions')
      .select('ratings_data, total_battles, user_id')

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      throw sessionsError
    }

    console.log(`Found ${sessions?.length || 0} TrueSkill sessions`)

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No sessions to aggregate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Aggregate ratings by Pokemon ID
    const pokemonStats = new Map<number, {
      totalMu: number;
      totalSigma: number;
      totalBattles: number;
      totalWins: number;
      userCount: number;
      name: string;
    }>()

    // Process each session
    sessions.forEach((session: TrueSkillSession) => {
      const ratingsData = session.ratings_data || {}
      
      Object.entries(ratingsData).forEach(([pokemonIdStr, rating]) => {
        const pokemonId = parseInt(pokemonIdStr)
        if (isNaN(pokemonId)) return

        const existing = pokemonStats.get(pokemonId) || {
          totalMu: 0,
          totalSigma: 0,
          totalBattles: 0,
          totalWins: 0,
          userCount: 0,
          name: `Pokemon ${pokemonId}` // Fallback name
        }

        // Aggregate the ratings
        existing.totalMu += rating.mu || 25
        existing.totalSigma += rating.sigma || 8.333
        existing.totalBattles += rating.battleCount || 0
        existing.totalWins += Math.floor((rating.battleCount || 0) * 0.6) // Estimate 60% win rate
        existing.userCount += 1

        pokemonStats.set(pokemonId, existing)
      })
    })

    console.log(`Aggregated stats for ${pokemonStats.size} Pokemon`)

    // Clear existing global rankings
    const { error: deleteError } = await supabase
      .from('global_rankings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error clearing existing rankings:', deleteError)
    }

    // Insert new global rankings
    const globalRankings = Array.from(pokemonStats.entries()).map(([pokemonId, stats]) => {
      const averageRating = stats.userCount > 0 ? stats.totalMu / stats.userCount : 25
      const averageSigma = stats.userCount > 0 ? stats.totalSigma / stats.userCount : 8.333
      const confidenceScore = Math.max(0, 100 - (averageSigma * 10))

      // Determine generation based on Pokemon ID
      let generation = 1
      if (pokemonId >= 152 && pokemonId <= 251) generation = 2
      else if (pokemonId >= 252 && pokemonId <= 386) generation = 3
      else if (pokemonId >= 387 && pokemonId <= 493) generation = 4
      else if (pokemonId >= 494 && pokemonId <= 649) generation = 5
      else if (pokemonId >= 650 && pokemonId <= 721) generation = 6
      else if (pokemonId >= 722 && pokemonId <= 809) generation = 7
      else if (pokemonId >= 810 && pokemonId <= 905) generation = 8
      else if (pokemonId >= 906 && pokemonId <= 1025) generation = 9

      return {
        pokemon_id: pokemonId,
        pokemon_name: stats.name,
        generation: generation,
        total_battles: stats.totalBattles,
        total_wins: stats.totalWins,
        average_rating: averageRating,
        confidence_score: confidenceScore
      }
    })

    if (globalRankings.length > 0) {
      const { error: insertError } = await supabase
        .from('global_rankings')
        .insert(globalRankings)

      if (insertError) {
        console.error('Error inserting global rankings:', insertError)
        throw insertError
      }

      console.log(`Inserted ${globalRankings.length} global rankings`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        aggregated: globalRankings.length,
        message: `Successfully aggregated rankings for ${globalRankings.length} Pokemon`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in aggregate-global-rankings:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
