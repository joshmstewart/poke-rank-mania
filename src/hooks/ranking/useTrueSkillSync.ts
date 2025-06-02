
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  // CRITICAL FIX: Stable references to prevent infinite re-renders
  const allRatings = getAllRatings();
  const contextReady = pokemonLookupMap.size > 0;
  const ratingsCount = Object.keys(allRatings).length;

  // CRITICAL FIX: Only process when we have stable data
  const shouldProcess = useMemo(() => {
    return contextReady && ratingsCount > 0;
  }, [contextReady, ratingsCount]);

  useEffect(() => {
    if (!shouldProcess) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] Not ready - Context: ${contextReady}, Ratings: ${ratingsCount}`);
      return;
    }

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] ===== PROCESSING TRUESKILL DATA =====`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] Processing ${ratingsCount} ratings`);
    
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    const rankings: RankedPokemon[] = [];

    ratedPokemonIds.forEach(pokemonId => {
      const basePokemon = pokemonLookupMap.get(pokemonId);
      const ratingData = allRatings[pokemonId.toString()];

      if (basePokemon && ratingData) {
        const rating = new Rating(ratingData.mu, ratingData.sigma);
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));

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
      }
    });

    rankings.sort((a, b) => b.score - a.score);

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] ✅ Generated ${rankings.length} stable rankings`);
    setLocalRankings(rankings);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] ===== END PROCESSING =====`);
  }, [shouldProcess, allRatings, pokemonLookupMap]);

  const updateLocalRankings = useMemo(() => {
    return (newRankings: RankedPokemon[]) => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] Updating ${newRankings.length} rankings`);
      
      const formattedRankings = newRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      
      setLocalRankings(formattedRankings);
    };
  }, []);

  return {
    localRankings,
    updateLocalRankings
  };
};
