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

  // CRITICAL FIX: Completely deterministic loading with NO variability
  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    console.log(`🔒 [DETERMINISTIC_LOAD_FIXED] ===== STARTING ULTRA-DETERMINISTIC POKEMON LOAD =====`);
    console.log(`🔒 [DETERMINISTIC_LOAD_FIXED] Pokemon locked status: ${pokemonLockedRef.current}`);
    
    // If Pokemon are already locked, return existing data immediately
    if (pokemonLockedRef.current && allPokemon.length > 0) {
      console.log(`🔒 [DETERMINISTIC_LOAD_FIXED] Pokemon already locked at ${allPokemon.length} - returning existing data`);
      return allPokemon;
    }

    // Clear cache completely for fresh deterministic load
    if (!pokemonLockedRef.current) {
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('pokemon-cache-') || 
        key.startsWith('pokemon-form-filters') ||
        key.startsWith('excluded-pokemon')
      );
      cacheKeys.forEach(key => {
        console.log(`🧹 [DETERMINISTIC_LOAD_FIXED] Clearing cache: ${key}`);
        localStorage.removeItem(key);
      });
      console.log(`🧹 [DETERMINISTIC_LOAD_FIXED] All Pokemon-related cache cleared for deterministic load`);
    }

    setIsLoading(true);
    
    try {
      console.log(`🚀 [DETERMINISTIC_LOAD_FIXED] Making API call for deterministic data`);
      
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
      
      if (!allPokemonData || allPokemonData.length === 0) {
        throw new Error(`No Pokemon data received from API call`);
      }
      
      console.log(`🚀 [DETERMINISTIC_LOAD_FIXED] API returned ${allPokemonData.length} Pokemon`);
      
      // ULTRA-CRITICAL FIX: Sort by ID to ensure 100% consistent ordering
      const sortedPokemon = [...allPokemonData].sort((a, b) => a.id - b.id);
      console.log(`🔒 [DETERMINISTIC_LOAD_FIXED] Pokemon sorted by ID for absolute consistency`);
      
      // CRITICAL FIX: Apply filtering in a completely deterministic way
      console.log(`🔒 [DETERMINISTIC_LOAD_FIXED] Starting deterministic filtering of ${sortedPokemon.length} Pokemon`);
      
      const filteredPokemon: Pokemon[] = [];
      const excludedPokemon: Pokemon[] = [];
      
      // Process each Pokemon in order to ensure deterministic results
      for (let i = 0; i < sortedPokemon.length; i++) {
        const pokemon = sortedPokemon[i];
        
        // CRITICAL: Use a snapshot of filter state at this moment
        const include = shouldIncludePokemon(pokemon);
        
        if (include) {
          filteredPokemon.push(pokemon);
        } else {
          excludedPokemon.push(pokemon);
          storePokemon(pokemon);
        }
        
        // Log every 100th Pokemon for debugging
        if (i % 100 === 0) {
          console.log(`🔒 [DETERMINISTIC_LOAD_FIXED] Processed ${i}/${sortedPokemon.length} Pokemon`);
        }
      }
      
      console.log(`✅ [DETERMINISTIC_LOAD_FIXED] Deterministic filtering complete:`);
      console.log(`✅ [DETERMINISTIC_LOAD_FIXED] - Total input: ${sortedPokemon.length}`);
      console.log(`✅ [DETERMINISTIC_LOAD_FIXED] - Included: ${filteredPokemon.length}`);
      console.log(`✅ [DETERMINISTIC_LOAD_FIXED] - Excluded: ${excludedPokemon.length}`);
      
      // NO SHUFFLING - keep strict ID order for absolute determinism
      const finalPokemon = filteredPokemon;
      
      console.log(`✅ [DETERMINISTIC_LOAD_FIXED] Final deterministic result: ${finalPokemon.length} Pokemon`);
      
      // Verify deterministic distribution
      if (finalPokemon.length > 0) {
        const finalIds = finalPokemon.map(p => p.id);
        const finalMinId = Math.min(...finalIds);
        const finalMaxId = Math.max(...finalIds);
        console.log(`✅ [DETERMINISTIC_LOAD_FIXED] Deterministic ID range: ${finalMinId} - ${finalMaxId}`);
        
        const deterministicDistribution = {
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
        console.log(`✅ [DETERMINISTIC_LOAD_FIXED] DETERMINISTIC distribution (should be same every time):`, deterministicDistribution);
      }
      
      setAllPokemon(finalPokemon);
      setIsLoading(false);
      
      // Lock Pokemon after successful deterministic load
      pokemonLockedRef.current = true;
      console.log(`🔒 [DETERMINISTIC_LOAD_FIXED] Pokemon LOCKED at ${finalPokemon.length} - will be identical on every refresh`);
      
      return finalPokemon;
      
    } catch (error) {
      console.error(`🚨 [DETERMINISTIC_LOAD_FIXED] Deterministic load failed:`, error);
      setIsLoading(false);
      
      toast({
        title: "Network Error", 
        description: `Failed to load Pokémon data deterministically. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 10000
      });
      
      return [];
    }
  }, [shouldIncludePokemon, storePokemon, allPokemon.length]);

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    return loadInitialBatch(genId, fullRankingMode);
  }, [loadInitialBatch]);

  // Clear cache and unlock when needed
  const clearCache = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('pokemon-cache-') || 
      key.startsWith('pokemon-form-filters') ||
      key.startsWith('excluded-pokemon')
    );
    keys.forEach(key => localStorage.removeItem(key));
    pokemonLockedRef.current = false;
    setAllPokemon([]);
    console.log("🧹 [DETERMINISTIC_LOAD_FIXED] All Pokemon cache cleared - next load will be fresh and deterministic");
  }, []);

  return {
    allPokemon,
    isLoading,
    isBackgroundLoading: false,
    loadPokemon,
    clearCache
  };
};
