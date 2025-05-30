
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

  // ENHANCED: Network-resilient loading with exponential backoff
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
        console.log("🧹 [PERFORMANCE_FIX] Cache corrupted, fetching fresh data");
        localStorage.removeItem(cacheKey);
      }
    }

    setIsLoading(true);
    
    // ENHANCED: Network resilience with retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 [NETWORK_RESILIENCE] Attempt ${attempt}/${maxRetries} - Loading Pokemon with optimized batching`);
        
        // Add exponential backoff delay for retries
        if (attempt > 1) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 2), 5000); // Cap at 5 seconds
          console.log(`🚀 [NETWORK_RESILIENCE] Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        // PERFORMANCE FIX: Load and process in chunks to prevent UI blocking
        const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
        
        if (!allPokemonData || allPokemonData.length === 0) {
          throw new Error(`No Pokemon data received from API (attempt ${attempt})`);
        }
        
        console.log(`🚀 [NETWORK_RESILIENCE] ✅ Successfully fetched ${allPokemonData.length} Pokemon on attempt ${attempt}`);
        
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
        console.log(`✅ [NETWORK_RESILIENCE] Processed ${shuffledPokemon.length} Pokemon with optimized filtering`);
        
        // Cache the result
        try {
          localStorage.setItem(cacheKey, JSON.stringify(shuffledPokemon));
          console.log(`💾 [NETWORK_RESILIENCE] Cached ${shuffledPokemon.length} Pokemon for faster future loads`);
        } catch (e) {
          console.warn("🚨 [NETWORK_RESILIENCE] Could not cache Pokemon data - storage full");
        }
        
        setAllPokemon(shuffledPokemon);
        setIsLoading(false);
        
        // Lock Pokemon after successful load
        pokemonLockedRef.current = true;
        console.log(`🔒 [NETWORK_RESILIENCE] Pokemon locked at ${shuffledPokemon.length} to prevent reloads`);
        
        return shuffledPokemon;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`🚨 [NETWORK_RESILIENCE] Attempt ${attempt}/${maxRetries} failed:`, error);
        
        // If this is not the last attempt, continue to retry
        if (attempt < maxRetries) {
          console.log(`🔄 [NETWORK_RESILIENCE] Will retry after delay...`);
          continue;
        }
        
        // On final failure, check for any usable cached data
        console.error(`🚨 [NETWORK_RESILIENCE] All ${maxRetries} attempts failed. Checking for fallback data...`);
        
        // Try any available cache as emergency fallback
        const fallbackKeys = Object.keys(localStorage).filter(key => key.startsWith('pokemon-cache-'));
        for (const key of fallbackKeys) {
          try {
            const fallbackData = JSON.parse(localStorage.getItem(key) || '[]');
            if (fallbackData.length > 0) {
              console.log(`💾 [NETWORK_RESILIENCE] Using fallback cache: ${fallbackData.length} Pokemon from ${key}`);
              setAllPokemon(fallbackData);
              setIsLoading(false);
              pokemonLockedRef.current = true;
              return fallbackData;
            }
          } catch (e) {
            console.warn(`🚨 [NETWORK_RESILIENCE] Fallback cache ${key} corrupted, removing`);
            localStorage.removeItem(key);
          }
        }
      }
    }
    
    // If we get here, all attempts failed and no fallback was available
    console.error("🚨 [NETWORK_RESILIENCE] Complete failure - no Pokemon data available");
    setIsLoading(false);
    
    toast({
      title: "Network Error",
      description: `Failed to load Pokémon data after ${maxRetries} attempts. ${lastError?.message || 'Unknown error'}`,
      variant: "destructive",
      duration: 10000
    });
    
    return [];
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
