
import { useEffect, useState } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, debugStore } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  useEffect(() => {
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ===== COMPREHENSIVE DATA AUDIT =====`);
    
    // CRITICAL FIX: Call the debug function to verify store state
    debugStore();
    
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] TRUESKILL STORE AUDIT:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Store ratings count: ${ratedPokemonIds.length}`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Store rating IDs: ${ratedPokemonIds.slice(0, 20).join(', ')}${ratedPokemonIds.length > 20 ? '...' : ''}`);
    
    // CRITICAL FIX: Also check localStorage directly for comparison
    const localStorageData = localStorage.getItem('trueskill-ratings-store');
    if (localStorageData) {
      try {
        const parsed = JSON.parse(localStorageData);
        const persistedRatings = parsed.state?.ratings || {};
        const persistedCount = Object.keys(persistedRatings).length;
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - localStorage ratings count: ${persistedCount}`);
        
        if (persistedCount !== ratedPokemonIds.length) {
          console.error(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ❌ CRITICAL MISMATCH: Store has ${ratedPokemonIds.length}, localStorage has ${persistedCount}`);
          console.error(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ❌ This indicates a serious data loading issue`);
        }
      } catch (e) {
        console.error(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ❌ Failed to parse localStorage data:`, e);
      }
    } else {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ⚠️ No localStorage data found`);
    }
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] CONTEXT AUDIT:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Pokemon lookup map size: ${pokemonLookupMap.size}`);

    if (ratedPokemonIds.length === 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] No TrueSkill ratings found, keeping current state`);
      return;
    }

    if (pokemonLookupMap.size === 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] Pokemon context not ready yet, keeping current state`);
      return;
    }

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] PROCESSING TRUESKILL DATA:`);

    const rankings: RankedPokemon[] = [];
    const missingFromContext: number[] = [];

    ratedPokemonIds.forEach(pokemonId => {
      const basePokemon = pokemonLookupMap.get(pokemonId);
      const ratingData = allRatings[pokemonId];

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
          missingFromContext.push(pokemonId);
        }
      }
    });

    rankings.sort((a, b) => b.score - a.score);

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] FINAL TRUESKILL PROCESSING:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Generated ${rankings.length} TrueSkill rankings`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Missing from context: ${missingFromContext.length}`);

    setLocalRankings(rankings);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ===== END COMPREHENSIVE AUDIT =====`);
  }, [getAllRatings, pokemonLookupMap.size, debugStore]);

  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] MANUAL UPDATE CALLED:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Updating with ${newRankings.length} rankings`);
    
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
