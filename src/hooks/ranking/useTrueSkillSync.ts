
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, debugStore, comprehensiveEnvironmentalDebug, forceRehydrate, waitForHydration } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  // CRITICAL FIX: Wait for proper hydration before doing anything
  useEffect(() => {
    const initializeWithProperHydration = async () => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ===== STARTING PROPER HYDRATION =====`);
      
      // Force immediate rehydration
      forceRehydrate();
      
      // Wait for hydration to complete
      await waitForHydration();
      
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ===== HYDRATION COMPLETE =====`);
      debugStore();
      comprehensiveEnvironmentalDebug();
    };
    
    initializeWithProperHydration();
  }, [forceRehydrate, waitForHydration, debugStore, comprehensiveEnvironmentalDebug]);

  const allRatings = getAllRatings();
  const contextReady = pokemonLookupMap.size > 0;
  const ratingsCount = Object.keys(allRatings).length;

  console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Current state: context=${contextReady}, ratings=${ratingsCount}`);

  useEffect(() => {
    if (!contextReady) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Context not ready - Pokemon lookup map size: ${pokemonLookupMap.size}`);
      return;
    }

    if (ratingsCount === 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ❌ NO RATINGS! This should be 400+!`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Attempting additional rehydration...`);
      forceRehydrate();
      return;
    }

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ===== PROCESSING ${ratingsCount} RATINGS =====`);
    
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

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ✅ Generated ${rankings.length} rankings (should be 400+)`);
    if (rankings.length > 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Sample rankings:`, rankings.slice(0, 5).map(p => `${p.name} (${p.score.toFixed(2)})`));
    }
    
    if (rankings.length < 100) {
      console.error(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ❌ CRITICAL: Only ${rankings.length} rankings generated, expected 400+!`);
    }
    
    setLocalRankings(rankings);
  }, [contextReady, ratingsCount, allRatings, pokemonLookupMap, forceRehydrate]);

  const updateLocalRankings = useMemo(() => {
    return (newRankings: RankedPokemon[]) => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Updating ${newRankings.length} rankings`);
      
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
