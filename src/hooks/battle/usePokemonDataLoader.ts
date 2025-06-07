
import { useCallback } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const usePokemonDataLoader = () => {
  const loadPokemonData = useCallback(async (genId = 0, fullRankingMode = true): Promise<Pokemon[]> => {
    console.log(`🔒 [DATA_LOADER] Starting Pokemon data load for generation ${genId}`);
    
    // Clear ALL Pokemon-related cache for absolute freshness
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('pokemon-cache-') || 
      key.startsWith('pokemon-form-filters') ||
      key.startsWith('excluded-pokemon') ||
      key.includes('pokemon')
    );
    cacheKeys.forEach(key => {
      console.log(`🧹 [DATA_LOADER] Clearing cache: ${key}`);
      localStorage.removeItem(key);
    });

    try {
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
      
      if (!allPokemonData || allPokemonData.length === 0) {
        throw new Error(`No Pokemon data received from API call`);
      }
      
      console.log(`🔒 [DATA_LOADER] API returned ${allPokemonData.length} Pokemon`);
      
      // ULTRA-CRITICAL: Sort by ID for absolute consistency
      const sortedPokemon = [...allPokemonData].sort((a, b) => a.id - b.id);
      console.log(`🔒 [DATA_LOADER] Pokemon sorted by ID for absolute consistency`);
      
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
