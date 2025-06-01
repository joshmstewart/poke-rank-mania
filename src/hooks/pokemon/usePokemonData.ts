import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "./types";
import { usePokemonService } from "@/hooks/pokemon/usePokemonService";
import { formatPokemonName } from "@/utils/pokemon";

export const usePokemonData = () => {
  const { getAllPokemon } = usePokemonService();

  const getPokemonData = useCallback(async (
    selectedGeneration: number,
    currentPage: number,
    loadSize: number,
    loadingType: LoadingType
  ) => {
    console.log(`🔒 [DETERMINISTIC_DATA] ===== GET POKEMON DATA (DETERMINISTIC) =====`);
    console.log(`🔒 [DETERMINISTIC_DATA] Params: gen=${selectedGeneration}, page=${currentPage}, size=${loadSize}, type=${loadingType}`);
    
    // Get ALL Pokemon first
    const allPokemonResult = await getAllPokemon();
    
    // DEBUGGING: Log the exact type and content we received
    console.log(`🔒 [DEBUG_DATA_FLOW] Raw result type:`, typeof allPokemonResult);
    console.log(`🔒 [DEBUG_DATA_FLOW] Is array:`, Array.isArray(allPokemonResult));
    console.log(`🔒 [DEBUG_DATA_FLOW] Length:`, allPokemonResult?.length || 'NO LENGTH');
    console.log(`🔒 [DEBUG_DATA_FLOW] First 3 items:`, allPokemonResult?.slice(0, 3));
    
    // Type guard to ensure we have a Pokemon array
    if (!Array.isArray(allPokemonResult)) {
      console.log(`🔒 [DETERMINISTIC_DATA] No valid Pokemon array received`);
      return {
        availablePokemon: [],
        rankedPokemon: [],
        totalPages: 0
      };
    }
    
    const allPokemon = allPokemonResult as Pokemon[];
    console.log(`🔒 [DETERMINISTIC_DATA] Raw Pokemon from service: ${allPokemon.length}`);
    
    // DEBUGGING: Check if we're losing Pokemon at each step
    console.log(`🔒 [DEBUG_FILTER_STEPS] Starting with ${allPokemon.length} Pokemon`);
    
    // CRITICAL FIX: Sort by ID to ensure consistent ordering
    const sortedPokemon = [...allPokemon].sort((a, b) => a.id - b.id);
    console.log(`🔒 [DEBUG_FILTER_STEPS] After sorting: ${sortedPokemon.length} Pokemon`);
    
    // Apply name formatting to ALL Pokemon before any other processing
    const formattedPokemon = sortedPokemon.map(pokemon => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name)
    }));
    console.log(`🔒 [DEBUG_FILTER_STEPS] After formatting: ${formattedPokemon.length} Pokemon`);
    
    // CRITICAL FIX: Use the SAME filtering logic as the loader to ensure consistency
    // Import and use the exact same shouldIncludePokemon function
    const { useFormFilters } = await import("@/hooks/form-filters/useFormFilters");
    const { shouldIncludePokemon } = useFormFilters();
    
    // Apply form filters (this should be deterministic and match the loader)
    const filteredPokemon = formattedPokemon.filter(shouldIncludePokemon);
    console.log(`🔒 [DEBUG_FILTER_STEPS] After form filtering: ${filteredPokemon.length} Pokemon`);
    console.log(`🔒 [DEBUG_FILTER_STEPS] Pokemon lost in filtering: ${formattedPokemon.length - filteredPokemon.length}`);
    
    // Apply generation filter if needed - FIXED LOGIC
    let generationFiltered = filteredPokemon;
    if (selectedGeneration > 0) {
      const beforeGenFilter = generationFiltered.length;
      generationFiltered = filteredPokemon.filter(pokemon => {
        let gen: number;
        let baseId = pokemon.id;
        
        // For high IDs (variants/forms), try to map to base Pokemon generation
        if (pokemon.id > 1025) {
          const mod1000 = pokemon.id % 1000;
          const mod10000 = pokemon.id % 10000;
          
          if (mod1000 >= 1 && mod1000 <= 1025) {
            baseId = mod1000;
          } else if (mod10000 >= 1 && mod10000 <= 1025) {
            baseId = mod10000;
          } else {
            baseId = pokemon.id;
          }
        }
        
        // Standard generation ranges based on base ID
        if (baseId <= 151) gen = 1;
        else if (baseId <= 251) gen = 2;
        else if (baseId <= 386) gen = 3;
        else if (baseId <= 493) gen = 4;
        else if (baseId <= 649) gen = 5;
        else if (baseId <= 721) gen = 6;
        else if (baseId <= 809) gen = 7;
        else if (baseId <= 905) gen = 8;
        else if (baseId <= 1025) gen = 9;
        else {
          gen = 9;
        }
        
        const matches = gen === selectedGeneration;
        return matches;
      });
      console.log(`🔒 [DEBUG_FILTER_STEPS] Generation filter (gen ${selectedGeneration}): ${beforeGenFilter} → ${generationFiltered.length}`);
    }
    
    // CRITICAL FIX: Keep Pokemon sorted by ID for deterministic ordering
    const finalPokemon = [...generationFiltered].sort((a, b) => a.id - b.id);
    
    const totalPages = Math.ceil(finalPokemon.length / loadSize);
    
    console.log(`🔒 [DETERMINISTIC_DATA] FINAL DETERMINISTIC RESULT:`);
    console.log(`🔒 [DETERMINISTIC_DATA] Available: ${finalPokemon.length} (sorted by ID)`);
    console.log(`🔒 [DETERMINISTIC_DATA] Ranked: 0 (manual mode starts empty)`);
    console.log(`🔒 [DETERMINISTIC_DATA] Total pages: ${totalPages}`);
    
    // DEBUGGING: Log the data flow summary
    console.log(`🔒 [DEBUG_DATA_FLOW_SUMMARY] ===== DATA FLOW SUMMARY =====`);
    console.log(`🔒 [DEBUG_DATA_FLOW_SUMMARY] Service returned: ${allPokemon.length}`);
    console.log(`🔒 [DEBUG_DATA_FLOW_SUMMARY] After form filters: ${filteredPokemon.length}`);
    console.log(`🔒 [DEBUG_DATA_FLOW_SUMMARY] After gen filters: ${generationFiltered.length}`);
    console.log(`🔒 [DEBUG_DATA_FLOW_SUMMARY] Final result: ${finalPokemon.length}`);
    
    return {
      availablePokemon: finalPokemon,
      rankedPokemon: [], // Manual mode starts with empty rankings
      totalPages
    };
  }, [getAllPokemon]);

  return { getPokemonData };
};
