
import { useCallback } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const usePokemonDataLoader = () => {
  const loadPokemonData = useCallback(async (genId = 0, fullRankingMode = true): Promise<Pokemon[]> => {
    console.log(`🔒 [DATA_LOADER] Starting COMPLETE Pokemon data load for generation ${genId}`);
    
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
      // FULL DATASET LOADING: Remove batch restrictions for complete rankings
      console.log(`🔒 [DATA_LOADER] Loading COMPLETE Pokemon dataset (~1500 Pokemon) for accurate rankings`);
      
      // Show progress toast for full dataset loading
      toast({
        title: "Loading Complete Pokemon Dataset", 
        description: "Loading all ~1500 Pokemon for accurate rankings...",
        duration: 8000
      });
      
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false, 1500);
      
      if (!allPokemonData || allPokemonData.length === 0) {
        console.warn(`🔒 [DATA_LOADER] No Pokemon data received, trying fallback`);
        
        // FALLBACK: Try again with full dataset
        const fallbackData = await fetchAllPokemon(genId, true, false, 1500);
        if (fallbackData && fallbackData.length > 0) {
          console.log(`🔒 [DATA_LOADER] Fallback successful: ${fallbackData.length} Pokemon loaded`);
          return fallbackData.sort((a, b) => a.id - b.id);
        }
        
        throw new Error(`No Pokemon data received from API after fallback attempt`);
      }
      
      // DEBUG INFO: Log complete dataset information
      console.log(`📊 [DATASET_DEBUG] Complete dataset loaded: ${allPokemonData.length} Pokemon`);
      console.log(`🔒 [DATA_LOADER] API returned COMPLETE dataset: ${allPokemonData.length} Pokemon`);
      
      // Sort by ID for consistency
      const sortedPokemon = [...allPokemonData].sort((a, b) => a.id - b.id);
      console.log(`🔒 [DATA_LOADER] Pokemon sorted by ID for consistency - Complete dataset ready for rankings`);
      
      // Mark loading as successful
      localStorage.removeItem('pokemon-loading-failed');
      
      // Success toast
      toast({
        title: "Dataset Complete", 
        description: `Successfully loaded ${sortedPokemon.length} Pokemon for complete rankings!`,
        duration: 5000
      });
      
      return sortedPokemon;
      
    } catch (error) {
      console.error(`🔒 [DATA_LOADER] Complete dataset load failed:`, error);
      
      // Mark loading as failed for next attempt
      localStorage.setItem('pokemon-loading-failed', 'true');
      
      toast({
        title: "Loading Error", 
        description: `Unable to load complete Pokemon dataset. Rankings may be incomplete.`,
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
