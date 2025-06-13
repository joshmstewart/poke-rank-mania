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

  // SIMPLIFIED LOADING: Reduced complexity, better error handling
  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    console.log(`🔒 [POKEMON_LOADER] Starting Pokemon load - genId: ${genId}, fullRanking: ${fullRankingMode}`);
    
    const loadingState = getLoadingState();
    console.log(`🔒 [POKEMON_LOADER] Current state - loading: ${loadingState.isLoading}, cache: ${hasGlobalCache()}, local: ${allPokemon.length}`);
    
    // QUICK RETURN: If we already have cache, use it immediately
    if (hasGlobalCache()) {
      const cache = getGlobalCache();
      console.log(`🔒 [POKEMON_LOADER] Using existing cache: ${cache.filtered.length} filtered Pokemon`);
      
      useExistingCache();
      setIsLoading(false);
      pokemonLockedRef.current = true;
      
      return cache.filtered;
    }
    
    // WAIT FOR EXISTING LOAD: If currently loading, wait for it
    if (loadingState.isLoading && loadingState.promise) {
      console.log(`🔒 [POKEMON_LOADER] Load in progress, waiting...`);
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
        console.error(`🔒 [POKEMON_LOADER] Wait for load failed:`, error);
        setLoadingState(false);
      }
    }
    
    // RETURN EXISTING: If already locked and have data, return it
    if (pokemonLockedRef.current && allPokemon.length > 0) {
      console.log(`🔒 [POKEMON_LOADER] Already have locked data: ${allPokemon.length} Pokemon`);
      return allPokemon;
    }

    // START NEW LOAD: Only if we really need to
    console.log(`🔒 [POKEMON_LOADER] Starting fresh load`);
    setIsLoading(true);

    try {
      const loadPromise = loadPokemonData(genId, fullRankingMode);
      setLoadingState(true, loadPromise);
      
      const sortedPokemon = await loadPromise;
      
      if (!sortedPokemon || sortedPokemon.length === 0) {
        throw new Error('No Pokemon data loaded');
      }
      
      console.log(`🔒 [POKEMON_LOADER] Raw data loaded: ${sortedPokemon.length} Pokemon`);
      
      // Apply filtering
      const filteredPokemon = processFilteredPokemon(sortedPokemon);
      console.log(`🔒 [POKEMON_LOADER] After filtering: ${filteredPokemon.length} Pokemon`);
      
      // Store in cache
      setGlobalCache(filteredPokemon, sortedPokemon);
      
      setIsLoading(false);
      pokemonLockedRef.current = true;
      setLoadingState(false);
      
      return filteredPokemon;
      
    } catch (error) {
      console.error(`🔒 [POKEMON_LOADER] Load failed:`, error);
      setLoadingState(false);
      setIsLoading(false);
      
      // DON'T clear cache on error - keep any existing data
      console.log(`🔒 [POKEMON_LOADER] Keeping existing cache on error`);
      
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
