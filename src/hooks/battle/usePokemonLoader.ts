
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

  // COMPLETE DATASET LOADING: Removed batch restrictions for full rankings
  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    console.log(`🔒 [POKEMON_LOADER] Starting COMPLETE Pokemon load - genId: ${genId}, fullRanking: ${fullRankingMode}`);
    
    const loadingState = getLoadingState();
    console.log(`🔒 [POKEMON_LOADER] Current state - loading: ${loadingState.isLoading}, cache: ${hasGlobalCache()}, local: ${allPokemon.length}`);
    
    // QUICK RETURN: If we already have complete cache, use it immediately
    if (hasGlobalCache()) {
      const cache = getGlobalCache();
      console.log(`🔒 [POKEMON_LOADER] Using existing complete cache: ${cache.filtered.length} filtered Pokemon`);
      console.log(`📊 [CACHE_DEBUG] Cache contains: ${cache.raw.length} total Pokemon, ${cache.filtered.length} filtered`);
      
      useExistingCache();
      setIsLoading(false);
      pokemonLockedRef.current = true;
      
      return cache.filtered;
    }
    
    // WAIT FOR EXISTING LOAD: If currently loading, wait for it
    if (loadingState.isLoading && loadingState.promise) {
      console.log(`🔒 [POKEMON_LOADER] Complete dataset load in progress, waiting...`);
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
        console.error(`🔒 [POKEMON_LOADER] Wait for complete load failed:`, error);
        setLoadingState(false);
      }
    }
    
    // RETURN EXISTING: If already locked and have complete data, return it
    if (pokemonLockedRef.current && allPokemon.length > 0) {
      console.log(`🔒 [POKEMON_LOADER] Already have locked complete data: ${allPokemon.length} Pokemon`);
      return allPokemon;
    }

    // START NEW COMPLETE LOAD: Load full dataset for accurate rankings
    console.log(`🔒 [POKEMON_LOADER] Starting fresh COMPLETE dataset load`);
    console.log(`📊 [LOAD_DEBUG] Loading complete Pokemon dataset for accurate rankings`);
    setIsLoading(true);

    try {
      const loadPromise = loadPokemonData(genId, fullRankingMode);
      setLoadingState(true, loadPromise);
      
      const sortedPokemon = await loadPromise;
      
      if (!sortedPokemon || sortedPokemon.length === 0) {
        throw new Error('No Pokemon data loaded from complete dataset');
      }
      
      // DEBUG INFO: Log complete dataset statistics
      console.log(`📊 [DATASET_COMPLETE] Raw data loaded: ${sortedPokemon.length} Pokemon from complete dataset`);
      console.log(`🔒 [POKEMON_LOADER] Complete dataset loaded: ${sortedPokemon.length} Pokemon`);
      
      // Apply filtering to complete dataset
      const filteredPokemon = processFilteredPokemon(sortedPokemon);
      console.log(`📊 [FILTER_DEBUG] After filtering complete dataset: ${filteredPokemon.length} Pokemon available for battles`);
      console.log(`🔒 [POKEMON_LOADER] After filtering: ${filteredPokemon.length} Pokemon ready for ranking`);
      
      // Store complete dataset in cache
      setGlobalCache(filteredPokemon, sortedPokemon);
      
      setIsLoading(false);
      pokemonLockedRef.current = true;
      setLoadingState(false);
      
      console.log(`✅ [DATASET_SUCCESS] Complete Pokemon dataset ready: ${filteredPokemon.length} filtered, ${sortedPokemon.length} total`);
      
      return filteredPokemon;
      
    } catch (error) {
      console.error(`🔒 [POKEMON_LOADER] Complete dataset load failed:`, error);
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
