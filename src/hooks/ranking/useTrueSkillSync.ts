
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, debugStore, comprehensiveEnvironmentalDebug } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  // CRITICAL DEBUG: Check store state immediately
  useEffect(() => {
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] ===== COMPREHENSIVE STORE INVESTIGATION =====`);
    debugStore();
    comprehensiveEnvironmentalDebug();
    
    const allRatings = getAllRatings();
    const ratingsKeys = Object.keys(allRatings);
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] Store ratings object:`, allRatings);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] Ratings keys:`, ratingsKeys);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] Ratings count: ${ratingsKeys.length}`);
    
    if (ratingsKeys.length > 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] Sample rating data:`, allRatings[ratingsKeys[0]]);
      ratingsKeys.slice(0, 10).forEach(pokemonId => {
        const rating = allRatings[pokemonId];
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] Pokemon ${pokemonId}: mu=${rating.mu}, sigma=${rating.sigma}, battles=${rating.battleCount || 0}`);
      });
    } else {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] ❌ NO RATINGS IN STORE - THIS IS THE PROBLEM!`);
    }
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] Context ready: ${pokemonLookupMap.size > 0}`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] Context Pokemon count: ${pokemonLookupMap.size}`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_DEBUG] ===== END STORE INVESTIGATION =====`);
  }, []);

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
      if (!contextReady) {
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] ❌ Context not ready - Pokemon lookup map size: ${pokemonLookupMap.size}`);
      }
      if (ratingsCount === 0) {
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] ❌ No ratings in store - this is why rankings are 0!`);
      }
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
      } else {
        if (!basePokemon) {
          console.warn(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] Pokemon ${pokemonId} not found in context`);
        }
        if (!ratingData) {
          console.warn(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] No rating data for Pokemon ${pokemonId}`);
        }
      }
    });

    rankings.sort((a, b) => b.score - a.score);

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] ✅ Generated ${rankings.length} stable rankings`);
    if (rankings.length > 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_STABLE] Top 5 rankings:`, rankings.slice(0, 5).map(p => `${p.name} (${p.score.toFixed(2)})`));
    }
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
