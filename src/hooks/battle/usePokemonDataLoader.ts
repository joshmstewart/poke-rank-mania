
import { useCallback } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const usePokemonDataLoader = () => {
  const loadPokemonData = useCallback(async (genId = 0, fullRankingMode = true): Promise<Pokemon[]> => {
    console.log(`🔒 [DATA_LOADER] Starting Pokemon data load for generation ${genId}`);
    
    // INTELLIGENT CACHE CLEARING: Only clear cache if we have loading issues, not proactively
    const shouldClearCache = localStorage.getItem('pokemon-loading-failed') === 'true';
    
    if (shouldClearCache) {
      console.log(`🧹 [DATA_LOADER] Previous loading failed, clearing cache for fresh start`);
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('pokemon-cache-') || 
        key.startsWith('pokemon-form-filters') ||
        key.startsWith('excluded-pokemon')
      );
      cacheKeys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('pokemon-loading-failed');
    }

    try {
      // PROGRESSIVE LOADING: Start with smaller batch for faster initial load
      const initialBatchSize = fullRankingMode ? 200 : 150;
      console.log(`🔒 [DATA_LOADER] Loading initial batch of ${initialBatchSize} Pokemon`);
      
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, true, initialBatchSize);
      
      if (!allPokemonData || allPokemonData.length === 0) {
        console.warn(`🔒 [DATA_LOADER] No Pokemon data received, trying fallback`);
        
        // FALLBACK: Try with even smaller batch
        const fallbackData = await fetchAllPokemon(genId, false, true, 100);
        if (fallbackData && fallbackData.length > 0) {
          console.log(`🔒 [DATA_LOADER] Fallback successful: ${fallbackData.length} Pokemon`);
          return fallbackData.sort((a, b) => a.id - b.id);
        }
        
        throw new Error(`No Pokemon data received from API after fallback attempt`);
      }
      
      console.log(`🔒 [DATA_LOADER] API returned ${allPokemonData.length} Pokemon`);
      
      // Sort by ID for consistency
      const sortedPokemon = [...allPokemonData].sort((a, b) => a.id - b.id);
      console.log(`🔒 [DATA_LOADER] Pokemon sorted by ID for consistency`);
      
      // Mark loading as successful
      localStorage.removeItem('pokemon-loading-failed');
      
      return sortedPokemon;
      
    } catch (error) {
      console.error(`🔒 [DATA_LOADER] Load failed:`, error);
      
      // Mark loading as failed for next attempt
      localStorage.setItem('pokemon-loading-failed', 'true');
      
      toast({
        title: "Loading Error", 
        description: `Unable to load Pokémon data. The app will try again on next reload.`,
        variant: "destructive",
        duration: 8000
      });
      
      throw error;
    }
  }, []);

  return {
    loadPokemonData
  };
};
