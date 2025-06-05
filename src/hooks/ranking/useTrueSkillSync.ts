import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, isHydrated, waitForHydration, syncInProgress, sessionId, loadFromCloud } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  
  // ULTRA AGGRESSIVE DEBUG: Track every state change with stack traces
  const [localRankings, setLocalRankingsInternal] = useState<RankedPokemon[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasTriedCloudSync, setHasTriedCloudSync] = useState(false);

  // ULTRA AGGRESSIVE DEBUG: Wrapper function to track all state changes
  const setLocalRankings = (newRankings: RankedPokemon[] | ((prev: RankedPokemon[]) => RankedPokemon[])) => {
    const timestamp = Date.now();
    const stack = new Error().stack;
    
    console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] ===== setLocalRankings CALLED =====`);
    console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Call type: ${typeof newRankings}`);
    console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Stack trace:`, stack);
    
    if (typeof newRankings === 'function') {
      console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Function-based update`);
      
      setLocalRankingsInternal(prev => {
        console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Previous state type:`, typeof prev, 'Array?', Array.isArray(prev));
        console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Previous state length:`, Array.isArray(prev) ? prev.length : 'NOT_ARRAY');
        console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Previous state value:`, prev);
        
        const result = newRankings(prev);
        
        console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Function returned type:`, typeof result, 'Array?', Array.isArray(result));
        console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Function returned length:`, Array.isArray(result) ? result.length : 'NOT_ARRAY');
        console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Function returned value:`, result);
        
        if (!Array.isArray(result)) {
          console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] ❌❌❌ FUNCTION RETURNED NON-ARRAY! Type: ${typeof result}`);
          console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] ❌❌❌ Forcing empty array`);
          return [];
        }
        
        return result;
      });
    } else {
      console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Direct value update`);
      console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Value type:`, typeof newRankings, 'Array?', Array.isArray(newRankings));
      console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Value length:`, Array.isArray(newRankings) ? newRankings.length : 'NOT_ARRAY');
      console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] Value:`, newRankings);
      
      if (!Array.isArray(newRankings)) {
        console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] ❌❌❌ NON-ARRAY PASSED! Type: ${typeof newRankings}`);
        console.error(`🚨🚨🚨 [ULTRA_AGGRESSIVE_DEBUG_${timestamp}] ❌❌❌ Forcing empty array instead`);
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
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ===== MAIN EFFECT TRIGGERED =====`);
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] contextReady:`, contextReady);
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] isInitialized:`, isInitialized);
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] syncInProgress:`, syncInProgress);
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ratingsCount:`, ratingsCount);
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] pokemonLookupMap:`, pokemonLookupMap);
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] pokemonLookupMap size:`, pokemonLookupMap?.size);
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] allRatings keys:`, Object.keys(allRatings));
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] Current localRankings type:`, typeof localRankings, 'Array?', Array.isArray(localRankings));
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] Current localRankings length:`, Array.isArray(localRankings) ? localRankings.length : 'NOT_ARRAY');
    
    if (!contextReady || !isInitialized || syncInProgress) {
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ❌ Early return - setting empty array`);
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] Reason: contextReady=${contextReady}, isInitialized=${isInitialized}, syncInProgress=${syncInProgress}`);
      setLocalRankings([]);
      return;
    }

    if (ratingsCount === 0) {
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ❌ No ratings, setting empty array`);
      setLocalRankings([]);
      return;
    }
    
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ✅ Processing ${ratingsCount} ratings...`);
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] Rated Pokemon IDs:`, ratedPokemonIds.slice(0, 10));
    const rankings: RankedPokemon[] = [];

    try {
      let processedCount = 0;
      let failedCount = 0;
      
      ratedPokemonIds.forEach(pokemonId => {
        if (!pokemonLookupMap) {
          console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ❌ pokemonLookupMap is null/undefined for ID ${pokemonId}`);
          failedCount++;
          return;
        }
        
        const basePokemon = pokemonLookupMap.get(pokemonId);
        const ratingData = allRatings[pokemonId.toString()];

        if (!basePokemon) {
          console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ❌ No basePokemon found for ID ${pokemonId}`);
          failedCount++;
          return;
        }
        
        if (!ratingData) {
          console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ❌ No ratingData found for ID ${pokemonId}`);
          failedCount++;
          return;
        }

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
        processedCount++;
        
        if (processedCount <= 5) {
          console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ✅ Processed Pokemon ${processedCount}: ${rankedPokemon.name} (ID: ${pokemonId})`);
        }
      });

      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ===== PROCESSING COMPLETE =====`);
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] Total processed: ${processedCount}`);
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] Total failed: ${failedCount}`);
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] Final rankings array length: ${rankings.length}`);

      rankings.sort((a, b) => b.score - a.score);
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ✅ Sorted rankings, calling setLocalRankings with ${rankings.length} Pokemon`);
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] Top 3 after sort:`, rankings.slice(0, 3).map(p => `${p.name}: ${p.score}`));
      
      setLocalRankings(rankings);
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ✅ setLocalRankings called successfully`);
      
    } catch (error) {
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] ❌❌❌ ERROR processing rankings:`, error);
      console.error(`🔥🔥🔥 [MAIN_EFFECT_${effectId}] Error stack:`, error.stack);
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

  // ULTRA AGGRESSIVE DEBUG: Check state before returning
  const returnId = Date.now();
  console.error(`🔥🔥🔥 [RETURN_CHECK_${returnId}] ===== RETURN CHECK =====`);
  console.error(`🔥🔥🔥 [RETURN_CHECK_${returnId}] localRankings type:`, typeof localRankings);
  console.error(`🔥🔥🔥 [RETURN_CHECK_${returnId}] localRankings is array:`, Array.isArray(localRankings));
  console.error(`🔥🔥🔥 [RETURN_CHECK_${returnId}] localRankings length:`, Array.isArray(localRankings) ? localRankings.length : 'NOT_ARRAY');
  console.error(`🔥🔥🔥 [RETURN_CHECK_${returnId}] localRankings value (first 3):`, Array.isArray(localRankings) ? localRankings.slice(0, 3).map(p => p?.name) : 'NOT_ARRAY');

  // FINAL SAFETY: Force array if somehow still undefined/null
  const safeLocalRankings = Array.isArray(localRankings) ? localRankings : [];
  
  if (!Array.isArray(localRankings)) {
    console.error(`🔥🔥🔥 [RETURN_CHECK_${returnId}] ❌❌❌ CRITICAL: localRankings is not an array at return time!`);
    console.error(`🔥🔥🔥 [RETURN_CHECK_${returnId}] Type:`, typeof localRankings);
    console.error(`🔥🔥🔥 [RETURN_CHECK_${returnId}] Value:`, localRankings);
  }

  console.error(`🔥🔥🔥 [RETURN_CHECK_${returnId}] ✅ Returning safeLocalRankings length:`, safeLocalRankings.length);

  return {
    localRankings: safeLocalRankings,
    updateLocalRankings
  };
};
