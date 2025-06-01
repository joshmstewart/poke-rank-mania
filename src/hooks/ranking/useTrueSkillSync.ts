
import { useEffect, useState } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  // CRITICAL FIX: Sync with TrueSkill store only when both store and context are ready
  useEffect(() => {
    console.log(`🔥 [TRUESKILL_SYNC] ===== CHECKING READINESS =====`);
    
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔥 [TRUESKILL_SYNC] TrueSkill ratings count: ${ratedPokemonIds.length}`);
    console.log(`🔥 [TRUESKILL_SYNC] TrueSkill rating IDs: ${ratedPokemonIds.slice(0, 20).join(', ')}${ratedPokemonIds.length > 20 ? '...' : ''}`);
    console.log(`🔥 [TRUESKILL_SYNC] Pokemon lookup map size: ${pokemonLookupMap.size}`);

    // CRITICAL FIX: Only proceed if both data sources are ready
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥 [TRUESKILL_SYNC] No ratings found, setting empty rankings`);
      setLocalRankings([]);
      return;
    }

    if (pokemonLookupMap.size === 0) {
      console.log(`🔥 [TRUESKILL_SYNC] Pokemon context not ready yet, waiting...`);
      return;
    }

    console.log(`🔥 [TRUESKILL_SYNC] Both data sources ready, generating rankings`);
    console.log(`🔥 [TRUESKILL_SYNC] =====TRUESKILL DETAILS=====`);
    console.log(`🔥 [TRUESKILL_SYNC] Total ratings in store: ${ratedPokemonIds.length}`);
    console.log(`🔥 [TRUESKILL_SYNC] Context map size: ${pokemonLookupMap.size}`);

    const rankings: RankedPokemon[] = [];
    const missingFromContext: number[] = [];

    ratedPokemonIds.forEach(pokemonId => {
      const basePokemon = pokemonLookupMap.get(pokemonId);
      const ratingData = allRatings[pokemonId];

      if (basePokemon && ratingData) {
        const rating = new Rating(ratingData.mu, ratingData.sigma);
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));

        // Apply name formatting
        const formattedName = formatPokemonName(basePokemon.name);

        const rankedPokemon: RankedPokemon = {
          ...basePokemon,
          name: formattedName,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          count: ratingData.battleCount || 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };

        rankings.push(rankedPokemon);
      } else {
        if (!basePokemon) {
          missingFromContext.push(pokemonId);
          console.log(`🔥 [TRUESKILL_SYNC] ⚠️ Missing Pokemon data for ID ${pokemonId} in context`);
        }
        if (!ratingData) {
          console.log(`🔥 [TRUESKILL_SYNC] ⚠️ Missing rating data for ID ${pokemonId}`);
        }
      }
    });

    console.log(`🔥 [TRUESKILL_SYNC] CRITICAL INSIGHT: Found ${missingFromContext.length} Pokemon IDs in TrueSkill that aren't in context`);
    console.log(`🔥 [TRUESKILL_SYNC] Missing IDs (first 20): ${missingFromContext.slice(0, 20).join(', ')}${missingFromContext.length > 20 ? '...' : ''}`);

    // Sort by score
    rankings.sort((a, b) => b.score - a.score);

    console.log(`🔥 [TRUESKILL_SYNC] Generated ${rankings.length} formatted rankings out of ${ratedPokemonIds.length} total ratings`);
    console.log(`🔥 [TRUESKILL_SYNC] Sample rankings:`, rankings.slice(0, 3).map(p => ({
      name: p.name,
      id: p.id,
      score: p.score.toFixed(3)
    })));

    setLocalRankings(rankings);
  }, [getAllRatings, pokemonLookupMap.size]); // CRITICAL FIX: Depend on map size, not map object

  // Manual update function that preserves formatting
  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    console.log(`🔥 [TRUESKILL_SYNC] Manual update with ${newRankings.length} rankings`);
    
    // Ensure all names are properly formatted
    const formattedRankings = newRankings.map(pokemon => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name)
    }));
    
    setLocalRankings(formattedRankings);
  };

  return {
    localRankings,
    updateLocalRankings
  };
};
