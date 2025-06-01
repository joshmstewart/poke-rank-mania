
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/form-filters/useFormFilters";

// CRITICAL FIX: Global singleton to prevent multiple simultaneous loads
let globalLoadingLock = false;
let globalPokemonCache: Pokemon[] | null = null;
let globalLoadPromise: Promise<Pokemon[]> | null = null;

export const usePokemonLoader = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pokemonLockedRef = useRef(false);
  
  // Get form filters
  const { shouldIncludePokemon, analyzeFilteringPipeline } = useFormFilters();

  // CRITICAL FIX: Ultra-deterministic singleton loading
  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] ===== SINGLETON POKEMON LOAD ENTRY =====`);
    console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Global loading lock: ${globalLoadingLock}`);
    console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Global cache exists: ${!!globalPokemonCache}`);
    console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Local Pokemon count: ${allPokemon.length}`);
    
    // If we already have global cache, use it immediately
    if (globalPokemonCache && globalPokemonCache.length > 0) {
      console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Using existing global cache: ${globalPokemonCache.length} Pokemon`);
      
      // Apply filtering deterministically
      const filteredPokemon = analyzeFilteringPipeline(globalPokemonCache);
      setAllPokemon(filteredPokemon);
      setIsLoading(false);
      pokemonLockedRef.current = true;
      
      return filteredPokemon;
    }
    
    // If currently loading globally, wait for it
    if (globalLoadingLock && globalLoadPromise) {
      console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Global load in progress - waiting...`);
      try {
        const result = await globalLoadPromise;
        const filteredPokemon = analyzeFilteringPipeline(result);
        setAllPokemon(filteredPokemon);
        setIsLoading(false);
        pokemonLockedRef.current = true;
        return filteredPokemon;
      } catch (error) {
        console.error(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Error waiting for global load:`, error);
        globalLoadingLock = false;
        globalLoadPromise = null;
      }
    }
    
    // If Pokemon are already locked locally, return existing data
    if (pokemonLockedRef.current && allPokemon.length > 0) {
      console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Pokemon already locked locally: ${allPokemon.length}`);
      return allPokemon;
    }

    // Start new global load
    console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Starting new global load`);
    globalLoadingLock = true;
    setIsLoading(true);
    
    // Clear ALL Pokemon-related cache for absolute freshness
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('pokemon-cache-') || 
      key.startsWith('pokemon-form-filters') ||
      key.startsWith('excluded-pokemon') ||
      key.includes('pokemon')
    );
    cacheKeys.forEach(key => {
      console.log(`🧹 [SINGLETON_LOAD_ULTRA_FIX] Clearing cache: ${key}`);
      localStorage.removeItem(key);
    });

    try {
      // Create the global load promise
      globalLoadPromise = fetchAllPokemon(genId, fullRankingMode, false);
      const allPokemonData = await globalLoadPromise;
      
      if (!allPokemonData || allPokemonData.length === 0) {
        throw new Error(`No Pokemon data received from API call`);
      }
      
      console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] API returned ${allPokemonData.length} Pokemon`);
      
      // ULTRA-CRITICAL: Sort by ID for absolute consistency
      const sortedPokemon = [...allPokemonData].sort((a, b) => a.id - b.id);
      console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Pokemon sorted by ID for absolute consistency`);
      
      // Store in global cache
      globalPokemonCache = sortedPokemon;
      console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Stored ${sortedPokemon.length} Pokemon in global cache`);
      
      // Apply filtering deterministically
      const filteredPokemon = analyzeFilteringPipeline(sortedPokemon);
      
      console.log(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Final result: ${filteredPokemon.length} Pokemon after filtering`);
      
      setAllPokemon(filteredPokemon);
      setIsLoading(false);
      pokemonLockedRef.current = true;
      globalLoadingLock = false;
      globalLoadPromise = null;
      
      return filteredPokemon;
      
    } catch (error) {
      console.error(`🔒 [SINGLETON_LOAD_ULTRA_FIX] Load failed:`, error);
      globalLoadingLock = false;
      globalLoadPromise = null;
      globalPokemonCache = null;
      setIsLoading(false);
      
      toast({
        title: "Network Error", 
        description: `Failed to load Pokémon data. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 10000
      });
      
      return [];
    }
  }, [shouldIncludePokemon, analyzeFilteringPipeline, allPokemon.length]);

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    return loadInitialBatch(genId, fullRankingMode);
  }, [loadInitialBatch]);

  // Clear ALL caches and reset global state
  const clearCache = useCallback(() => {
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
    globalLoadPromise = null;
    
    pokemonLockedRef.current = false;
    setAllPokemon([]);
    console.log("🧹 [SINGLETON_LOAD_ULTRA_FIX] All caches and global state cleared");
  }, []);

  return {
    allPokemon,
    isLoading,
    isBackgroundLoading: false,
    loadPokemon,
    clearCache
  };
};
