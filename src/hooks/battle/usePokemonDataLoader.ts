
import { useCallback } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const usePokemonDataLoader = () => {
  const loadPokemonData = useCallback(async (genId = 0, fullRankingMode = true): Promise<Pokemon[]> => {
    console.log(`🔒 [DATA_LOADER] Starting Pokemon data load for generation ${genId}`);
    
    // ULTRA-CRITICAL: Clear ALL caches and force fresh API calls
    console.log(`🧹 [CACHE_CLEAR] Clearing ALL caches to force fresh API calls...`);
    
    // Clear localStorage completely
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('pokemon') || key.includes('cache')) {
        console.log(`🧹 [CACHE_CLEAR] Removing: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Clear any in-memory caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log(`🧹 [CACHE_CLEAR] Clearing browser cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      } catch (error) {
        console.log(`🧹 [CACHE_CLEAR] Browser cache clear failed:`, error);
      }
    }

    try {
      console.log(`🔒 [DATA_LOADER] Making fresh API call with cache-busting...`);
      
      // Force fresh API call with cache-busting timestamp
      const timestamp = Date.now();
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false, timestamp);
      
      if (!allPokemonData || allPokemonData.length === 0) {
        throw new Error(`No Pokemon data received from API call`);
      }
      
      console.log(`🔒 [DATA_LOADER] Fresh API returned ${allPokemonData.length} Pokemon`);
      
      // ULTRA-CRITICAL: Sort by ID for absolute consistency
      const sortedPokemon = [...allPokemonData].sort((a, b) => a.id - b.id);
      console.log(`🔒 [DATA_LOADER] Pokemon sorted by ID for absolute consistency`);
      
      // CRITICAL: Log Deoxys specifically from fresh data
      const deoxysFromFresh = sortedPokemon.filter(p => p.name.toLowerCase().includes('deoxys'));
      console.log(`🔒 [FRESH_DEOXYS_CHECK] Found ${deoxysFromFresh.length} Deoxys in fresh API data:`, 
        deoxysFromFresh.map(p => `${p.name}(${p.id})`));
      
      return sortedPokemon;
      
    } catch (error) {
      console.error(`🔒 [DATA_LOADER] Load failed:`, error);
      
      toast({
        title: "Network Error", 
        description: `Failed to load Pokémon data. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 10000
      });
      
      throw error;
    }
  }, []);

  return {
    loadPokemonData
  };
};
