
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

  // ULTRA COMPREHENSIVE LOGGING: Track ALL data sources
  useEffect(() => {
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ===== COMPREHENSIVE DATA AUDIT =====`);
    
    // 1. Check TrueSkill Store
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] TRUESKILL STORE AUDIT:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Store ratings count: ${ratedPokemonIds.length}`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Store rating IDs: ${ratedPokemonIds.slice(0, 20).join(', ')}${ratedPokemonIds.length > 20 ? '...' : ''}`);
    
    // 2. Check localStorage for any ranking data
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] LOCALSTORAGE AUDIT:`);
    const localStorageKeys = Object.keys(localStorage);
    const rankingKeys = localStorageKeys.filter(key => 
      key.includes('ranking') || 
      key.includes('pokemon') || 
      key.includes('trueskill') ||
      key.includes('battle')
    );
    
    rankingKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - LocalStorage key "${key}": ${parsed.length} items`);
          } else if (typeof parsed === 'object' && parsed !== null) {
            const objectKeys = Object.keys(parsed);
            console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - LocalStorage key "${key}": object with ${objectKeys.length} keys`);
            if (objectKeys.length > 0) {
              console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - First few keys: ${objectKeys.slice(0, 10).join(', ')}`);
            }
          } else {
            console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - LocalStorage key "${key}": ${typeof parsed} value`);
          }
        }
      } catch (e) {
        console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - LocalStorage key "${key}": non-JSON value`);
      }
    });

    // 3. Check current localRankings state
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] CURRENT STATE AUDIT:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Current localRankings count: ${localRankings.length}`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Current localRankings IDs: ${localRankings.slice(0, 20).map(p => p.id).join(', ')}${localRankings.length > 20 ? '...' : ''}`);

    // 4. Check Pokemon context
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] CONTEXT AUDIT:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Pokemon lookup map size: ${pokemonLookupMap.size}`);

    // 5. Check if there are any React state sources we're missing
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] REACT STATE AUDIT:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Component useState localRankings: ${localRankings.length}`);
    
    // 6. Check for any generation-specific data
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] GENERATION-SPECIFIC DATA AUDIT:`);
    for (let gen = 0; gen <= 9; gen++) {
      const genKey = `manual-rankings-gen-${gen}`;
      const genData = localStorage.getItem(genKey);
      if (genData) {
        try {
          const parsed = JSON.parse(genData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Found gen ${gen} data: ${parsed.length} items`);
          }
        } catch (e) {
          console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Gen ${gen} data exists but not parseable`);
        }
      }
    }

    // CRITICAL: Only process TrueSkill if we have data AND context is ready
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] No TrueSkill ratings found, keeping current state`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ===== END COMPREHENSIVE AUDIT =====`);
      return;
    }

    if (pokemonLookupMap.size === 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] Pokemon context not ready yet, keeping current state`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ===== END COMPREHENSIVE AUDIT =====`);
      return;
    }

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] PROCESSING TRUESKILL DATA:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Both data sources ready, generating rankings from TrueSkill`);

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
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Setting localRankings to: ${rankings.length} items`);

    setLocalRankings(rankings);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] ===== END COMPREHENSIVE AUDIT =====`);
  }, [getAllRatings, pokemonLookupMap.size, localRankings.length]); // Include localRankings.length to detect external changes

  // Manual update function that preserves formatting
  const updateLocalRankings = (newRankings: RankedPokemon[]) => {
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] MANUAL UPDATE CALLED:`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Updating with ${newRankings.length} rankings`);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - New ranking IDs: ${newRankings.slice(0, 20).map(p => p.id).join(', ')}${newRankings.length > 20 ? '...' : ''}`);
    
    const formattedRankings = newRankings.map(pokemon => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name)
    }));
    
    setLocalRankings(formattedRankings);
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_ULTRA] - Manual update complete`);
  };

  return {
    localRankings,
    updateLocalRankings
  };
};
