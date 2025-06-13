
import { useState, useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { useGlobalPokemonCache } from "./useGlobalPokemonCache";
import { useProgressivePokemonLoader } from "./useProgressivePokemonLoader";
import { useSmartCache } from "./useSmartCache";

export const usePokemonLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const pokemonLockedRef = useRef(false);
  
  const {
    allPokemon: globalAllPokemon,
    rawUnfilteredPokemon,
    hasGlobalCache,
    getGlobalCache,
    setGlobalCache,
    useExistingCache,
    clearGlobalCache,
    getLoadingState,
    setLoadingState
  } = useGlobalPokemonCache();

  const {
    essentialPokemon,
    allPokemon: progressiveAllPokemon,
    isLoadingEssential,
    startBackgroundLoading,
    hasBackgroundData
  } = useProgressivePokemonLoader();

  const { getCachedData } = useSmartCache();

  // Use progressive data or global cache data
  const allPokemon = globalAllPokemon.length > 0 ? globalAllPokemon : progressiveAllPokemon;

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    console.log(`🚀 [POKEMON_LOADER] Fast loading with progressive approach`);
    
    const loadingState = getLoadingState();
    console.log(`🚀 [POKEMON_LOADER] Global loading lock: ${loadingState.isLoading}`);
    console.log(`🚀 [POKEMON_LOADER] Global cache exists: ${hasGlobalCache()}`);
    console.log(`🚀 [POKEMON_LOADER] Local Pokemon count: ${allPokemon.length}`);
    
    // If we already have global cache, use it immediately
    if (hasGlobalCache()) {
      const cache = getGlobalCache();
      console.log(`🚀 [POKEMON_LOADER] Using existing global cache: ${cache.filtered.length} filtered Pokemon`);
      
      useExistingCache();
      setIsLoading(false);
      pokemonLockedRef.current = true;
      
      return cache.filtered;
    }

    // Check smart cache for essential Pokemon
    const cachedEssential = getCachedData('essential');
    if (cachedEssential && cachedEssential.length > 0) {
      console.log(`🚀 [POKEMON_LOADER] Using cached essential Pokemon: ${cachedEssential.length}`);
      setGlobalCache(cachedEssential, cachedEssential);
      setIsLoading(false);
      pokemonLockedRef.current = true;
      
      // Start background loading for the rest
      setTimeout(() => startBackgroundLoading(), 100);
      
      return cachedEssential;
    }
    
    // If Pokemon are already locked locally, return existing data
    if (pokemonLockedRef.current && allPokemon.length > 0) {
      console.log(`🚀 [POKEMON_LOADER] Pokemon already locked locally: ${allPokemon.length}`);
      return allPokemon;
    }

    // Use progressive loading approach - return essential Pokemon immediately
    if (essentialPokemon.length > 0) {
      console.log(`🚀 [POKEMON_LOADER] Using essential Pokemon from progressive loader: ${essentialPokemon.length}`);
      setGlobalCache(essentialPokemon, essentialPokemon);
      setIsLoading(false);
      pokemonLockedRef.current = true;
      
      return essentialPokemon;
    }

    // If we reach here, we need to wait for essential Pokemon to load
    setIsLoading(true);
    
    return new Promise<Pokemon[]>((resolve) => {
      const checkForEssential = () => {
        if (essentialPokemon.length > 0) {
          console.log(`🚀 [POKEMON_LOADER] Essential Pokemon now available: ${essentialPokemon.length}`);
          setGlobalCache(essentialPokemon, essentialPokemon);
          setIsLoading(false);
          pokemonLockedRef.current = true;
          resolve(essentialPokemon);
        } else if (!isLoadingEssential) {
          // Loading failed, return empty array
          console.warn(`⚠️ [POKEMON_LOADER] Essential Pokemon loading failed`);
          setIsLoading(false);
          resolve([]);
        } else {
          // Still loading, check again
          setTimeout(checkForEssential, 100);
        }
      };
      
      checkForEssential();
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (isLoading) {
          console.warn(`⚠️ [POKEMON_LOADER] Timeout waiting for essential Pokemon`);
          setIsLoading(false);
          resolve(essentialPokemon); // Return whatever we have
        }
      }, 5000);
    });
  }, [
    allPokemon.length, 
    hasGlobalCache, 
    getGlobalCache, 
    useExistingCache, 
    getLoadingState, 
    setLoadingState, 
    setGlobalCache, 
    clearGlobalCache,
    essentialPokemon,
    isLoadingEssential,
    getCachedData,
    startBackgroundLoading
  ]);

  return {
    allPokemon,
    rawUnfilteredPokemon,
    isLoading: isLoading || isLoadingEssential,
    isBackgroundLoading: !hasBackgroundData,
    loadPokemon,
    clearCache: clearGlobalCache,
    hasEssentialData: essentialPokemon.length > 0,
    backgroundProgress: hasBackgroundData ? 100 : 0
  };
};
