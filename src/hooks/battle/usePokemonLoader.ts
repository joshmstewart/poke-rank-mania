import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/form-filters/useFormFilters";

export const usePokemonLoader = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pokemonLockedRef = useRef(false);
  
  // Get form filters
  const { shouldIncludePokemon, storePokemon } = useFormFilters();

  // CRITICAL FIX: Deterministic, consistent loading with NO randomization
  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    console.log(`🔒 [DETERMINISTIC_LOAD] ===== STARTING DETERMINISTIC POKEMON LOAD =====`);
    
    // Only clear cache if Pokemon are not already locked
    if (!pokemonLockedRef.current) {
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('pokemon-cache-'));
      cacheKeys.forEach(key => {
        console.log(`🧹 [DETERMINISTIC_LOAD] Clearing cache: ${key}`);
        localStorage.removeItem(key);
      });
      console.log(`🧹 [DETERMINISTIC_LOAD] Cache cleared for fresh load`);
    } else {
      console.log(`🔒 [DETERMINISTIC_LOAD] Pokemon already locked, skipping cache clear`);
      return allPokemon; // Return existing Pokemon if already loaded
    }

    setIsLoading(true);
    
    try {
      console.log(`🚀 [DETERMINISTIC_LOAD] Making deterministic API call`);
      
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
      
      if (!allPokemonData || allPokemonData.length === 0) {
        throw new Error(`No Pokemon data received from API call`);
      }
      
      console.log(`🚀 [DETERMINISTIC_LOAD] API returned ${allPokemonData.length} Pokemon`);
      
      // CRITICAL FIX: Sort by ID to ensure consistent ordering
      const sortedPokemon = [...allPokemonData].sort((a, b) => a.id - b.id);
      console.log(`🔒 [DETERMINISTIC_LOAD] Pokemon sorted by ID for consistency`);
      
      // CRITICAL FIX: Synchronous filtering to avoid race conditions
      const filteredPokemon: Pokemon[] = [];
      
      for (const pokemon of sortedPokemon) {
        const include = shouldIncludePokemon(pokemon);
        if (!include) {
          storePokemon(pokemon);
        } else {
          filteredPokemon.push(pokemon);
        }
      }
      
      console.log(`✅ [DETERMINISTIC_LOAD] Synchronous filtering complete: ${filteredPokemon.length} Pokemon after filtering`);
      
      // CRITICAL FIX: NO SHUFFLING - keep deterministic order
      // const shuffledPokemon = [...filteredPokemon].sort(() => Math.random() - 0.5); // REMOVED
      const finalPokemon = filteredPokemon; // Keep sorted by ID
      
      console.log(`✅ [DETERMINISTIC_LOAD] Final result: ${finalPokemon.length} Pokemon in deterministic order`);
      
      // Log deterministic distribution
      if (finalPokemon.length > 0) {
        const finalIds = finalPokemon.map(p => p.id);
        const finalMinId = Math.min(...finalIds);
        const finalMaxId = Math.max(...finalIds);
        console.log(`✅ [DETERMINISTIC_LOAD] Final ID range: ${finalMinId} - ${finalMaxId}`);
        
        const finalDistribution = {
          'Gen1(1-151)': finalIds.filter(id => id >= 1 && id <= 151).length,
          'Gen2(152-251)': finalIds.filter(id => id >= 152 && id <= 251).length,
          'Gen3(252-386)': finalIds.filter(id => id >= 252 && id <= 386).length,
          'Gen4(387-493)': finalIds.filter(id => id >= 387 && id <= 493).length,
          'Gen5(494-649)': finalIds.filter(id => id >= 494 && id <= 649).length,
          'Gen6(650-721)': finalIds.filter(id => id >= 650 && id <= 721).length,
          'Gen7(722-809)': finalIds.filter(id => id >= 722 && id <= 809).length,
          'Gen8(810-905)': finalIds.filter(id => id >= 810 && id <= 905).length,
          'Gen9(906+)': finalIds.filter(id => id >= 906).length,
        };
        console.log(`✅ [DETERMINISTIC_LOAD] Deterministic distribution:`, finalDistribution);
      }
      
      setAllPokemon(finalPokemon);
      setIsLoading(false);
      
      // Lock Pokemon after successful load to prevent reloads
      pokemonLockedRef.current = true;
      console.log(`🔒 [DETERMINISTIC_LOAD] Pokemon locked at ${finalPokemon.length} - will be consistent on reload`);
      
      return finalPokemon;
      
    } catch (error) {
      console.error(`🚨 [DETERMINISTIC_LOAD] Load failed:`, error);
      setIsLoading(false);
      
      toast({
        title: "Network Error", 
        description: `Failed to load Pokémon data. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 10000
      });
      
      return [];
    }
  }, [shouldIncludePokemon, storePokemon, allPokemon]);

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    return loadInitialBatch(genId, fullRankingMode);
  }, [loadInitialBatch]);

  // Clear cache when needed
  const clearCache = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('pokemon-cache-'));
    keys.forEach(key => localStorage.removeItem(key));
    pokemonLockedRef.current = false;
    console.log("🧹 [DETERMINISTIC_LOAD] Pokemon cache cleared - next load will be fresh");
  }, []);

  return {
    allPokemon,
    isLoading,
    isBackgroundLoading: false,
    loadPokemon,
    clearCache
  };
};
