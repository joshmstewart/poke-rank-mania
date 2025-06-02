
import { useState, useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { useGlobalPokemonCache } from "./useGlobalPokemonCache";
import { usePokemonDataLoader } from "./usePokemonDataLoader";
import { usePokemonFilterProcessor } from "./usePokemonFilterProcessor";

export const usePokemonLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const pokemonLockedRef = useRef(false);
  
  const {
    allPokemon,
    rawUnfilteredPokemon,
    hasGlobalCache,
    getGlobalCache,
    setGlobalCache,
    useExistingCache,
    clearGlobalCache,
    getLoadingState,
    setLoadingState
  } = useGlobalPokemonCache();

  const { loadPokemonData } = usePokemonDataLoader();
  const { processFilteredPokemon } = usePokemonFilterProcessor();

  // CRITICAL FIX: Ultra-deterministic singleton loading
  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    console.log(`🔒 [POKEMON_LOADER] ===== SINGLETON POKEMON LOAD ENTRY =====`);
    
    const loadingState = getLoadingState();
    console.log(`🔒 [POKEMON_LOADER] Global loading lock: ${loadingState.isLoading}`);
    console.log(`🔒 [POKEMON_LOADER] Global cache exists: ${hasGlobalCache()}`);
    console.log(`🔒 [POKEMON_LOADER] Local Pokemon count: ${allPokemon.length}`);
    
    // If we already have global cache, use it immediately
    if (hasGlobalCache()) {
      const cache = getGlobalCache();
      console.log(`🔒 [POKEMON_LOADER] Using existing global cache: ${cache.filtered.length} filtered, ${cache.raw.length} raw Pokemon`);
      
      useExistingCache();
      setIsLoading(false);
      pokemonLockedRef.current = true;
      
      return cache.filtered;
    }
    
    // If currently loading globally, wait for it
    if (loadingState.isLoading && loadingState.promise) {
      console.log(`🔒 [POKEMON_LOADER] Global load in progress - waiting...`);
      try {
        await loadingState.promise;
        if (hasGlobalCache()) {
          useExistingCache();
          setIsLoading(false);
          pokemonLockedRef.current = true;
          const cache = getGlobalCache();
          return cache.filtered;
        }
      } catch (error) {
        console.error(`🔒 [POKEMON_LOADER] Error waiting for global load:`, error);
        setLoadingState(false);
      }
    }
    
    // If Pokemon are already locked locally, return existing data
    if (pokemonLockedRef.current && allPokemon.length > 0) {
      console.log(`🔒 [POKEMON_LOADER] Pokemon already locked locally: ${allPokemon.length}`);
      return allPokemon;
    }

    // Start new global load
    console.log(`🔒 [POKEMON_LOADER] Starting new global load`);
    setIsLoading(true);

    try {
      // Create the global load promise
      const loadPromise = loadPokemonData(genId, fullRankingMode);
      setLoadingState(true, loadPromise);
      
      const sortedPokemon = await loadPromise;
      
      // Store the raw unfiltered data BEFORE any filtering
      console.log(`🔒 [RAW_DATA_STORAGE] Storing ${sortedPokemon.length} RAW unfiltered Pokemon separately`);
      
      // Apply filtering to get filtered data
      const filteredPokemon = processFilteredPokemon(sortedPokemon);
      
      // Store both datasets in global cache
      setGlobalCache(filteredPokemon, sortedPokemon);
      console.log(`🔒 [POKEMON_LOADER] Final result: ${filteredPokemon.length} filtered, ${sortedPokemon.length} raw Pokemon`);
      
      setIsLoading(false);
      pokemonLockedRef.current = true;
      setLoadingState(false);
      
      return filteredPokemon;
      
    } catch (error) {
      console.error(`🔒 [POKEMON_LOADER] Load failed:`, error);
      setLoadingState(false);
      clearGlobalCache();
      setIsLoading(false);
      
      return [];
    }
  }, [
    allPokemon.length, 
    hasGlobalCache, 
    getGlobalCache, 
    useExistingCache, 
    getLoadingState, 
    setLoadingState, 
    setGlobalCache, 
    clearGlobalCache,
    loadPokemonData,
    processFilteredPokemon
  ]);

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    return loadInitialBatch(genId, fullRankingMode);
  }, [loadInitialBatch]);

  return {
    allPokemon,
    rawUnfilteredPokemon,
    isLoading,
    isBackgroundLoading: false,
    loadPokemon,
    clearCache: clearGlobalCache
  };
};
