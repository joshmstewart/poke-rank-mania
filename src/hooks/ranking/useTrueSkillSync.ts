
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, isHydrated, waitForHydration, syncInProgress, sessionId, loadFromCloud } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  
  // AGGRESSIVE DEBUG: Track every state change with stack traces
  const [localRankings, setLocalRankingsInternal] = useState<RankedPokemon[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasTriedCloudSync, setHasTriedCloudSync] = useState(false);

  // AGGRESSIVE DEBUG: Wrapper function to track all state changes
  const setLocalRankings = (newRankings: RankedPokemon[] | ((prev: RankedPokemon[]) => RankedPokemon[])) => {
    const timestamp = Date.now();
    const stack = new Error().stack;
    
    if (typeof newRankings === 'function') {
      console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] setLocalRankings called with FUNCTION`);
      console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] Stack trace:`, stack);
      
      setLocalRankingsInternal(prev => {
        console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] Previous state type:`, typeof prev, 'Array?', Array.isArray(prev));
        console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] Previous state value:`, prev);
        
        const result = newRankings(prev);
        
        console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] Function returned type:`, typeof result, 'Array?', Array.isArray(result));
        console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] Function returned value:`, result);
        
        if (!Array.isArray(result)) {
          console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] ❌ FUNCTION RETURNED NON-ARRAY! Forcing empty array`);
          return [];
        }
        
        return result;
      });
    } else {
      console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] setLocalRankings called with DIRECT VALUE`);
      console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] Value type:`, typeof newRankings, 'Array?', Array.isArray(newRankings));
      console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] Value:`, newRankings);
      console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] Stack trace:`, stack);
      
      if (!Array.isArray(newRankings)) {
        console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] ❌ NON-ARRAY PASSED! Type:`, typeof newRankings);
        console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${timestamp}] ❌ Forcing empty array instead`);
        setLocalRankingsInternal([]);
      } else {
        setLocalRankingsInternal(newRankings);
      }
    }
  };

  useEffect(() => {
    const initializeWithCloudSync = async () => {
      console.log('🔍 [AGGRESSIVE_DEBUG] useTrueSkillSync initialization start');
      
      if (!isHydrated) {
        console.log('🔍 [AGGRESSIVE_DEBUG] Waiting for hydration...');
        await waitForHydration();
      }
      
      const initialRatings = useTrueSkillStore.getState().getAllRatings();
      const initialCount = Object.keys(initialRatings || {}).length;
      console.log('🔍 [AGGRESSIVE_DEBUG] Initial ratings count:', initialCount);
      
      if (!hasTriedCloudSync && sessionId) {
        setHasTriedCloudSync(true);
        
        try {
          console.log('🔍 [AGGRESSIVE_DEBUG] Attempting cloud sync...');
          await loadFromCloud();
          const postSyncRatings = useTrueSkillStore.getState().getAllRatings();
          const postSyncCount = Object.keys(postSyncRatings || {}).length;
          console.log('🔍 [AGGRESSIVE_DEBUG] Post-sync ratings count:', postSyncCount);
          
          if (postSyncCount > initialCount) {
            console.log(`Loaded ${postSyncCount - initialCount} additional ratings from cloud`);
          }
        } catch (error) {
          console.error('🔍 [AGGRESSIVE_DEBUG] Cloud sync failed:', error);
        }
      }
      
      if (syncInProgress) {
        console.log('🔍 [AGGRESSIVE_DEBUG] Sync in progress, waiting...');
        let attempts = 0;
        const maxAttempts = 50;
        
        while (useTrueSkillStore.getState().syncInProgress && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        console.log('🔍 [AGGRESSIVE_DEBUG] Sync wait completed, attempts:', attempts);
      }
      
      console.log('🔍 [AGGRESSIVE_DEBUG] Setting initialized to true');
      setIsInitialized(true);
    };
    
    initializeWithCloudSync().catch(error => {
      console.error('🔍 [AGGRESSIVE_DEBUG] Initialization failed:', error);
      setIsInitialized(true);
    });
  }, [isHydrated, sessionId, hasTriedCloudSync, waitForHydration, loadFromCloud]);

  const allRatings = getAllRatings() || {};
  const contextReady = pokemonLookupMap && pokemonLookupMap.size > 0;
  const ratingsCount = Object.keys(allRatings).length;

  useEffect(() => {
    const effectId = Date.now();
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] useTrueSkillSync main effect triggered`);
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] contextReady:`, contextReady);
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] isInitialized:`, isInitialized);
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] syncInProgress:`, syncInProgress);
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] ratingsCount:`, ratingsCount);
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] pokemonLookupMap type:`, typeof pokemonLookupMap);
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] pokemonLookupMap size:`, pokemonLookupMap?.size);
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] Current localRankings type:`, typeof localRankings, 'Array?', Array.isArray(localRankings));
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] Current localRankings length:`, Array.isArray(localRankings) ? localRankings.length : 'NOT_ARRAY');
    
    if (!contextReady || !isInitialized || syncInProgress) {
      console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] Early return - setting empty array`);
      setLocalRankings([]);
      return;
    }

    if (ratingsCount === 0) {
      console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] No ratings, setting empty array`);
      setLocalRankings([]);
      return;
    }
    
    console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] Processing ratings...`);
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    const rankings: RankedPokemon[] = [];

    try {
      ratedPokemonIds.forEach(pokemonId => {
        if (!pokemonLookupMap) {
          console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] pokemonLookupMap is null/undefined`);
          return;
        }
        
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
            winRate: 0,
            generation: basePokemon.generation || 1,
            image: basePokemon.image || ''
          };

          rankings.push(rankedPokemon);
        }
      });

      rankings.sort((a, b) => b.score - a.score);
      console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] Final rankings count:`, rankings.length);
      console.log(`🔍 [AGGRESSIVE_DEBUG_${effectId}] About to call setLocalRankings with rankings array of length:`, rankings.length);
      setLocalRankings(rankings);
    } catch (error) {
      console.error(`🔍 [AGGRESSIVE_DEBUG_${effectId}] Error processing rankings:`, error);
      setLocalRankings([]);
    }
  }, [contextReady, ratingsCount, allRatings, pokemonLookupMap, isInitialized, syncInProgress, sessionId]);

  const updateLocalRankings = useMemo(() => {
    return (newRankings: RankedPokemon[]) => {
      const updateId = Date.now();
      console.log(`🔍 [AGGRESSIVE_DEBUG_${updateId}] updateLocalRankings called`);
      console.log(`🔍 [AGGRESSIVE_DEBUG_${updateId}] Input type:`, typeof newRankings, 'Array?', Array.isArray(newRankings));
      console.log(`🔍 [AGGRESSIVE_DEBUG_${updateId}] Input value:`, newRankings);
      console.log(`🔍 [AGGRESSIVE_DEBUG_${updateId}] Input length:`, Array.isArray(newRankings) ? newRankings.length : 'NOT_ARRAY');
      console.log(`🔍 [AGGRESSIVE_DEBUG_${updateId}] Stack trace:`, new Error().stack);
      
      if (!Array.isArray(newRankings)) {
        console.warn(`🔍 [AGGRESSIVE_DEBUG_${updateId}] ❌ updateLocalRankings called with invalid data:`, newRankings);
        setLocalRankings([]);
        return;
      }
      
      const formattedRankings = newRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name),
        generation: pokemon.generation || 1,
        image: pokemon.image || ''
      }));
      
      console.log(`🔍 [AGGRESSIVE_DEBUG_${updateId}] Formatted rankings count:`, formattedRankings.length);
      setLocalRankings(formattedRankings);
    };
  }, []);

  // AGGRESSIVE DEBUG: Check state before returning
  const returnId = Date.now();
  console.log(`🔍 [AGGRESSIVE_DEBUG_${returnId}] ===== RETURN CHECK =====`);
  console.log(`🔍 [AGGRESSIVE_DEBUG_${returnId}] localRankings type:`, typeof localRankings);
  console.log(`🔍 [AGGRESSIVE_DEBUG_${returnId}] localRankings is array:`, Array.isArray(localRankings));
  console.log(`🔍 [AGGRESSIVE_DEBUG_${returnId}] localRankings value:`, localRankings);
  console.log(`🔍 [AGGRESSIVE_DEBUG_${returnId}] localRankings length:`, Array.isArray(localRankings) ? localRankings.length : 'NOT_ARRAY');

  // FINAL SAFETY: Force array if somehow still undefined/null
  const safeLocalRankings = Array.isArray(localRankings) ? localRankings : [];
  
  if (!Array.isArray(localRankings)) {
    console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${returnId}] ❌❌❌ CRITICAL: localRankings is not an array at return time!`);
    console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${returnId}] Type:`, typeof localRankings);
    console.error(`🚨🚨🚨 [AGGRESSIVE_DEBUG_${returnId}] Value:`, localRankings);
  }

  console.log(`🔍 [AGGRESSIVE_DEBUG_${returnId}] Returning safeLocalRankings length:`, safeLocalRankings.length);

  return {
    localRankings: safeLocalRankings,
    updateLocalRankings
  };
};
