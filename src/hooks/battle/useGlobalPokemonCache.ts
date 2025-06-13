
import { useState, useCallback, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";

// CRITICAL FIX: Global singleton to prevent multiple simultaneous loads
let globalLoadingLock = false;
let globalPokemonCache: Pokemon[] | null = null;
let globalRawPokemonCache: Pokemon[] | null = null;
let globalLoadPromise: Promise<Pokemon[]> | null = null;
let globalCacheReady = false; // NEW: Flag to indicate cache is ready

export const useGlobalPokemonCache = () => {
  // IMMEDIATE CACHE ACCESS: Initialize with cached data if available
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>(() => {
    console.log(`🔧 [GLOBAL_CACHE_INIT] Initializing with cached data: ${globalPokemonCache?.length || 0} Pokemon`);
    return globalPokemonCache || [];
  });
  
  const [rawUnfilteredPokemon, setRawUnfilteredPokemon] = useState<Pokemon[]>(() => {
    console.log(`🔧 [GLOBAL_CACHE_INIT] Initializing with raw cached data: ${globalRawPokemonCache?.length || 0} Pokemon`);
    return globalRawPokemonCache || [];
  });

  // CACHE READY STATE: Track when cache is fully ready
  useEffect(() => {
    if (globalPokemonCache && globalPokemonCache.length > 0 && globalRawPokemonCache) {
      globalCacheReady = true;
      console.log(`✅ [GLOBAL_CACHE_READY] Cache is ready with ${globalPokemonCache.length} filtered Pokemon`);
    }
  }, []);

  const hasGlobalCache = useCallback(() => {
    const hasCache = globalPokemonCache && globalPokemonCache.length > 0 && globalRawPokemonCache;
    console.log(`🔧 [GLOBAL_CACHE_CHECK] Has cache: ${!!hasCache}, ready: ${globalCacheReady}`);
    return hasCache;
  }, []);

  const isGlobalCacheReady = useCallback(() => {
    return globalCacheReady && hasGlobalCache();
  }, [hasGlobalCache]);

  const getGlobalCache = useCallback(() => {
    console.log(`🔧 [GLOBAL_CACHE_GET] Returning cache: ${globalPokemonCache?.length || 0} filtered, ${globalRawPokemonCache?.length || 0} raw`);
    return {
      filtered: globalPokemonCache || [],
      raw: globalRawPokemonCache || []
    };
  }, []);

  const setGlobalCache = useCallback((filtered: Pokemon[], raw: Pokemon[]) => {
    console.log(`🔧 [GLOBAL_CACHE_SET] Setting cache: ${filtered.length} filtered, ${raw.length} raw`);
    globalPokemonCache = filtered;
    globalRawPokemonCache = raw;
    globalCacheReady = true;
    setAllPokemon(filtered);
    setRawUnfilteredPokemon(raw);
  }, []);

  const useExistingCache = useCallback(() => {
    if (hasGlobalCache()) {
      const cache = getGlobalCache();
      console.log(`🔧 [GLOBAL_CACHE_USE] Using existing cache: ${cache.filtered.length} filtered Pokemon`);
      setAllPokemon(cache.filtered);
      setRawUnfilteredPokemon(cache.raw);
      return true;
    }
    return false;
  }, [hasGlobalCache, getGlobalCache]);

  const clearGlobalCache = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('pokemon-cache-') || 
      key.startsWith('pokemon-form-filters') ||
      key.startsWith('excluded-pokemon') ||
      key.includes('pokemon')
    );
    keys.forEach(key => localStorage.removeItem(key));
    
    // Reset global state
    globalLoadingLock = false;
    globalPokemonCache = null;
    globalRawPokemonCache = null;
    globalLoadPromise = null;
    globalCacheReady = false;
    
    setAllPokemon([]);
    setRawUnfilteredPokemon([]);
    console.log("🧹 [GLOBAL_CACHE] All caches and global state cleared");
  }, []);

  const getLoadingState = useCallback(() => {
    return {
      isLoading: globalLoadingLock,
      hasPromise: !!globalLoadPromise,
      promise: globalLoadPromise,
      cacheReady: globalCacheReady
    };
  }, []);

  const setLoadingState = useCallback((loading: boolean, promise: Promise<Pokemon[]> | null = null) => {
    console.log(`🔧 [GLOBAL_CACHE_LOADING] Setting loading state: ${loading}, promise: ${!!promise}`);
    globalLoadingLock = loading;
    globalLoadPromise = promise;
  }, []);

  return {
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
  };
};
