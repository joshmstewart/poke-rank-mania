
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { useGlobalPokemonCache } from "./useGlobalPokemonCache";
import { usePokemonDataLoader } from "./usePokemonDataLoader";
import { usePokemonFilterProcessor } from "./usePokemonFilterProcessor";

export const usePokemonLoader = () => {
  // IMMEDIATE CACHE ACCESS: Start with loading=false if cache is ready
  const {
    allPokemon,
    rawUnfilteredPokemon,
    hasGlobalCache,
    isGlobalCacheReady,
    getGlobalCache,
    setGlobalCache,
    useExistingCache,
    clearGlobalCache,
    getLoadingState,
    setLoadingState
  } = useGlobalPokemonCache();

  // SMART LOADING STATE: Only load if cache isn't ready
  const [isLoading, setIsLoading] = useState(() => {
    const cacheReady = isGlobalCacheReady();
    console.log(`🔧 [POKEMON_LOADER_INIT] Initial loading state: ${!cacheReady}, cache ready: ${cacheReady}`);
    return !cacheReady;
  });

  const pokemonLockedRef = useRef(false);
  
  const { loadPokemonData } = usePokemonDataLoader();
  const { processFilteredPokemon } = usePokemonFilterProcessor();

  // IMMEDIATE CACHE EFFECT: Use cache immediately when available
  useEffect(() => {
    if (isGlobalCacheReady() && !pokemonLockedRef.current) {
      console.log(`🔧 [POKEMON_LOADER_EFFECT] Cache is ready, using immediately`);
      useExistingCache();
      setIsLoading(false);
      pokemonLockedRef.current = true;
    }
  }, [isGlobalCacheReady, useExistingCache]);

  // COMPLETE DATASET LOADING: Removed batch restrictions for full rankings
  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    console.log(`🔧 [POKEMON_LOADER] Starting load - genId: ${genId}, fullRanking: ${fullRankingMode}`);
    
    // IMMEDIATE CACHE RETURN: If cache is ready, return it immediately
    if (isGlobalCacheReady()) {
      const cache = getGlobalCache();
      console.log(`🔧 [POKEMON_LOADER] ✅ Cache ready immediately: ${cache.filtered.length} filtered Pokemon`);
      
      if (!pokemonLockedRef.current) {
        useExistingCache();
        pokemonLockedRef.current = true;
      }
      setIsLoading(false);
      return cache.filtered;
    }
    
    const loadingState = getLoadingState();
    console.log(`🔧 [POKEMON_LOADER] Current state - loading: ${loadingState.isLoading}, cache: ${hasGlobalCache()}, local: ${allPokemon.length}`);
    
    // WAIT FOR EXISTING LOAD: If currently loading, wait for it
    if (loadingState.isLoading && loadingState.promise) {
      console.log(`🔧 [POKEMON_LOADER] Load in progress, waiting...`);
      try {
        await loadingState.promise;
        if (isGlobalCacheReady()) {
          useExistingCache();
          setIsLoading(false);
          pokemonLockedRef.current = true;
          const cache = getGlobalCache();
          return cache.filtered;
        }
      } catch (error) {
        console.error(`🔧 [POKEMON_LOADER] Wait for load failed:`, error);
        setLoadingState(false);
      }
    }
    
    // RETURN EXISTING: If already locked and have complete data, return it
    if (pokemonLockedRef.current && allPokemon.length > 0) {
      console.log(`🔧 [POKEMON_LOADER] Already have locked data: ${allPokemon.length} Pokemon`);
      setIsLoading(false);
      return allPokemon;
    }

    // START NEW COMPLETE LOAD: Load full dataset for accurate rankings
    console.log(`🔧 [POKEMON_LOADER] Starting fresh complete dataset load`);
    setIsLoading(true);

    try {
      const loadPromise = loadPokemonData(genId, fullRankingMode);
      setLoadingState(true, loadPromise);
      
      const sortedPokemon = await loadPromise;
      
      if (!sortedPokemon || sortedPokemon.length === 0) {
        throw new Error('No Pokemon data loaded from complete dataset');
      }
      
      console.log(`🔧 [POKEMON_LOADER] Complete dataset loaded: ${sortedPokemon.length} Pokemon`);
      
      // Apply filtering to complete dataset
      const filteredPokemon = processFilteredPokemon(sortedPokemon);
      console.log(`🔧 [POKEMON_LOADER] After filtering: ${filteredPokemon.length} Pokemon ready`);
      
      // Store complete dataset in cache
      setGlobalCache(filteredPokemon, sortedPokemon);
      
      setIsLoading(false);
      pokemonLockedRef.current = true;
      setLoadingState(false);
      
      console.log(`✅ [POKEMON_LOADER] Complete Pokemon dataset ready: ${filteredPokemon.length} filtered, ${sortedPokemon.length} total`);
      
      return filteredPokemon;
      
    } catch (error) {
      console.error(`🔧 [POKEMON_LOADER] Complete dataset load failed:`, error);
      setLoadingState(false);
      setIsLoading(false);
      
      console.log(`🔧 [POKEMON_LOADER] Keeping existing cache on error`);
      return [];
    }
  }, [
    allPokemon.length, 
    hasGlobalCache, 
    isGlobalCacheReady,
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
