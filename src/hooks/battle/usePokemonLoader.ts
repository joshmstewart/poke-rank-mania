
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/useFormFilters";

export const usePokemonLoader = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pokemonLockedRef = useRef(false);
  
  // Get form filters
  const { shouldIncludePokemon, storePokemon } = useFormFilters();

  // PERFORMANCE FIX: Optimized loading with batching and caching
  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    // CRITICAL FIX: If Pokemon are already locked, don't reload
    if (pokemonLockedRef.current && allPokemon.length > 0) {
      console.log(`🔒 [PERFORMANCE_FIX] Pokemon already loaded (${allPokemon.length}) - skipping reload`);
      setIsLoading(false);
      return allPokemon;
    }

    // Check cache first
    const cacheKey = `pokemon-cache-${genId}-${fullRankingMode}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached && !pokemonLockedRef.current) {
      try {
        const cachedPokemon = JSON.parse(cached);
        console.log(`🚀 [PERFORMANCE_FIX] Loaded ${cachedPokemon.length} Pokemon from cache`);
        setAllPokemon(cachedPokemon);
        pokemonLockedRef.current = true;
        setIsLoading(false);
        return cachedPokemon;
      } catch (e) {
        console.log("Cache corrupted, fetching fresh data");
        localStorage.removeItem(cacheKey);
      }
    }

    setIsLoading(true);
    try {
      console.log(`🚀 [PERFORMANCE_FIX] Loading Pokemon with optimized batching`);
      
      // PERFORMANCE FIX: Load and process in chunks to prevent UI blocking
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
      
      // Process in chunks to avoid blocking the main thread
      const processInChunks = (data: Pokemon[], chunkSize = 200): Promise<Pokemon[]> => {
        return new Promise((resolve) => {
          const filtered: Pokemon[] = [];
          let index = 0;
          
          const processChunk = () => {
            const chunk = data.slice(index, index + chunkSize);
            
            for (const pokemon of chunk) {
              const include = shouldIncludePokemon(pokemon);
              if (!include) {
                storePokemon(pokemon);
              } else {
                filtered.push(pokemon);
              }
            }
            
            index += chunkSize;
            
            if (index < data.length) {
              // Process next chunk in next tick
              setTimeout(processChunk, 0);
            } else {
              resolve(filtered);
            }
          };
          
          processChunk();
        });
      };
      
      const filteredPokemon = await processInChunks(allPokemonData);
      
      // PERFORMANCE FIX: Pre-shuffle once and cache
      const shuffledPokemon = [...filteredPokemon].sort(() => Math.random() - 0.5);
      console.log(`✅ [PERFORMANCE_FIX] Processed ${shuffledPokemon.length} Pokemon with optimized filtering`);
      
      // Cache the result
      try {
        localStorage.setItem(cacheKey, JSON.stringify(shuffledPokemon));
        console.log(`💾 [PERFORMANCE_FIX] Cached ${shuffledPokemon.length} Pokemon for faster future loads`);
      } catch (e) {
        console.warn("Could not cache Pokemon data - storage full");
      }
      
      setAllPokemon(shuffledPokemon);
      setIsLoading(false);
      
      // Lock Pokemon after successful load
      pokemonLockedRef.current = true;
      console.log(`🔒 [PERFORMANCE_FIX] Pokemon locked at ${shuffledPokemon.length} to prevent reloads`);
      
      return shuffledPokemon;
    } catch (error) {
      console.error("Error loading Pokemon:", error);
      toast({
        title: "Error loading Pokémon",
        description: "Could not load Pokémon data. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return [];
    }
  }, [shouldIncludePokemon, storePokemon, allPokemon.length]);

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    return loadInitialBatch(genId, fullRankingMode);
  }, [loadInitialBatch]);

  // PERFORMANCE FIX: Clear cache when needed
  const clearCache = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('pokemon-cache-'));
    keys.forEach(key => localStorage.removeItem(key));
    pokemonLockedRef.current = false;
    console.log("🧹 [PERFORMANCE_FIX] Pokemon cache cleared");
  }, []);

  return {
    allPokemon,
    isLoading,
    isBackgroundLoading: false,
    loadPokemon,
    clearCache
  };
};
