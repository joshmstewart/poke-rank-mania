
import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";

// CRITICAL FIX: Global singleton to prevent multiple simultaneous loads
let globalLoadingLock = false;
let globalPokemonCache: Pokemon[] | null = null;
let globalRawPokemonCache: Pokemon[] | null = null;
let globalLoadPromise: Promise<Pokemon[]> | null = null;

export const useGlobalPokemonCache = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [rawUnfilteredPokemon, setRawUnfilteredPokemon] = useState<Pokemon[]>([]);

  const hasGlobalCache = useCallback(() => {
    return globalPokemonCache && globalPokemonCache.length > 0 && globalRawPokemonCache;
  }, []);

  const getGlobalCache = useCallback(() => {
    return {
      filtered: globalPokemonCache || [],
      raw: globalRawPokemonCache || []
    };
  }, []);

  const setGlobalCache = useCallback((filtered: Pokemon[], raw: Pokemon[]) => {
    globalPokemonCache = filtered;
    globalRawPokemonCache = raw;
    setAllPokemon(filtered);
    setRawUnfilteredPokemon(raw);
  }, []);

  const useExistingCache = useCallback(() => {
    if (hasGlobalCache()) {
      const cache = getGlobalCache();
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
    
    setAllPokemon([]);
    setRawUnfilteredPokemon([]);
    console.log("🧹 [GLOBAL_CACHE] All caches and global state cleared");
  }, []);

  const getLoadingState = useCallback(() => {
    return {
      isLoading: globalLoadingLock,
      hasPromise: !!globalLoadPromise,
      promise: globalLoadPromise
    };
  }, []);

  const setLoadingState = useCallback((loading: boolean, promise: Promise<Pokemon[]> | null = null) => {
    globalLoadingLock = loading;
    globalLoadPromise = promise;
  }, []);

  return {
    allPokemon,
    rawUnfilteredPokemon,
    hasGlobalCache,
    getGlobalCache,
    setGlobalCache,
    useExistingCache,
    clearGlobalCache,
    getLoadingState,
    setLoadingState
  };
};
