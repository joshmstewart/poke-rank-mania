
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

  // CRITICAL FIX: Force fresh load by clearing cache first
  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    console.log(`🧹🧹🧹 [CACHE_CLEAR_FIX] ===== FORCING FRESH POKEMON LOAD =====`);
    
    // CRITICAL: Clear ALL Pokemon caches to force fresh API calls
    const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('pokemon-cache-'));
    cacheKeys.forEach(key => {
      console.log(`🧹🧹🧹 [CACHE_CLEAR_FIX] Clearing cache: ${key}`);
      localStorage.removeItem(key);
    });
    
    // Reset Pokemon lock to allow fresh loading
    pokemonLockedRef.current = false;
    console.log(`🧹🧹🧹 [CACHE_CLEAR_FIX] Cache cleared, Pokemon unlocked, starting fresh API fetch`);

    setIsLoading(true);
    
    try {
      console.log(`🚀🚀🚀 [FRESH_API_CALL] Making fresh API call with NO CACHE`);
      
      // CRITICAL: Call the API directly without any cache checks
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
      
      if (!allPokemonData || allPokemonData.length === 0) {
        throw new Error(`No Pokemon data received from fresh API call`);
      }
      
      console.log(`🚀🚀🚀 [FRESH_API_CALL] ✅ Fresh API call returned ${allPokemonData.length} Pokemon`);
      
      // CRITICAL: Log the ID distribution of what we got from API
      if (allPokemonData.length > 0) {
        const apiIds = allPokemonData.map(p => p.id);
        const apiMinId = Math.min(...apiIds);
        const apiMaxId = Math.max(...apiIds);
        console.log(`🚀🚀🚀 [FRESH_API_CALL] API returned ID range: ${apiMinId} - ${apiMaxId}`);
        
        const apiDistribution = {
          'Gen1(1-151)': apiIds.filter(id => id >= 1 && id <= 151).length,
          'Gen2(152-251)': apiIds.filter(id => id >= 152 && id <= 251).length,
          'Gen3(252-386)': apiIds.filter(id => id >= 252 && id <= 386).length,
          'Gen4(387-493)': apiIds.filter(id => id >= 387 && id <= 493).length,
          'Gen5(494-649)': apiIds.filter(id => id >= 494 && id <= 649).length,
          'Gen6(650-721)': apiIds.filter(id => id >= 650 && id <= 721).length,
          'Gen7(722-809)': apiIds.filter(id => id >= 722 && id <= 809).length,
          'Gen8(810-905)': apiIds.filter(id => id >= 810 && id <= 905).length,
          'Gen9(906+)': apiIds.filter(id => id >= 906).length,
        };
        console.log(`🚀🚀🚀 [FRESH_API_CALL] Fresh API distribution by generation:`, apiDistribution);
      }
      
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
      
      // Pre-shuffle once
      const shuffledPokemon = [...filteredPokemon].sort(() => Math.random() - 0.5);
      console.log(`✅🚀🚀🚀 [FRESH_API_CALL] Final result: ${shuffledPokemon.length} Pokemon after filtering`);
      
      // CRITICAL: Log the final ID distribution after filtering
      if (shuffledPokemon.length > 0) {
        const finalIds = shuffledPokemon.map(p => p.id);
        const finalMinId = Math.min(...finalIds);
        const finalMaxId = Math.max(...finalIds);
        console.log(`✅🚀🚀🚀 [FRESH_API_CALL] Final ID range after filtering: ${finalMinId} - ${finalMaxId}`);
        
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
        console.log(`✅🚀🚀🚀 [FRESH_API_CALL] Final distribution after filtering:`, finalDistribution);
      }
      
      setAllPokemon(shuffledPokemon);
      setIsLoading(false);
      
      // Lock Pokemon after successful load
      pokemonLockedRef.current = true;
      console.log(`🔒🚀🚀🚀 [FRESH_API_CALL] Pokemon locked at ${shuffledPokemon.length} to prevent reloads`);
      
      return shuffledPokemon;
      
    } catch (error) {
      console.error(`🚨🚀🚀🚀 [FRESH_API_CALL] Fresh API call failed:`, error);
      setIsLoading(false);
      
      toast({
        title: "Network Error", 
        description: `Failed to load fresh Pokémon data. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 10000
      });
      
      return [];
    }
  }, [shouldIncludePokemon, storePokemon]);

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    return loadInitialBatch(genId, fullRankingMode);
  }, [loadInitialBatch]);

  // Clear cache when needed
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
