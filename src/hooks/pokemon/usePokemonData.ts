
import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { LoadingType } from "./types";
import { usePokemonService } from "@/hooks/pokemon/usePokemonService";
import { formatPokemonName } from "@/utils/pokemon";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";
import { usePokemonContext } from "@/contexts/PokemonContext";

export const usePokemonData = () => {
  const { getAllPokemon } = usePokemonService();
  const { localRankings } = useTrueSkillSync();
  const { allPokemon: contextPokemon } = usePokemonContext();

  const getPokemonData = useCallback(async (
    selectedGeneration: number,
    currentPage: number,
    loadSize: number,
    loadingType: LoadingType
  ) => {
    console.log(`🔒 [DETERMINISTIC_DATA_FIXED] ===== GET POKEMON DATA (CONTEXT-FIRST APPROACH) =====`);
    console.log(`🔒 [DETERMINISTIC_DATA_FIXED] Params: gen=${selectedGeneration}, page=${currentPage}, size=${loadSize}, type=${loadingType}`);
    
    try {
      // CRITICAL FIX: Use context Pokemon first if available (1239 Pokemon loaded successfully)
      let allPokemon: Pokemon[] = [];
      
      if (contextPokemon && contextPokemon.length > 0) {
        console.log(`🔒 [DETERMINISTIC_DATA_FIXED] ✅ Using PokemonContext data: ${contextPokemon.length} Pokemon`);
        allPokemon = contextPokemon;
      } else {
        console.log(`🔒 [DETERMINISTIC_DATA_FIXED] ⚠️ Context empty, falling back to service`);
        const serviceResult = await getAllPokemon();
        
        if (!Array.isArray(serviceResult) || serviceResult.length === 0) {
          console.error(`🔒 [DETERMINISTIC_DATA_FIXED] ❌ Service also failed - no Pokemon available`);
          throw new Error(`No Pokemon data available from any source`);
        }
        
        allPokemon = serviceResult;
        console.log(`🔒 [DETERMINISTIC_DATA_FIXED] ✅ Using service data: ${allPokemon.length} Pokemon`);
      }
      
      console.log(`🔒 [DETERMINISTIC_DATA_FIXED] ✅ Valid Pokemon array: ${allPokemon.length}`);
      
      // Sort by ID for consistency
      const sortedPokemon = [...allPokemon].sort((a, b) => a.id - b.id);
      console.log(`🔒 [DEBUG_FILTER_STEPS] After sorting: ${sortedPokemon.length} Pokemon`);
      
      // Apply name formatting
      const formattedPokemon = sortedPokemon.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      console.log(`🔒 [DEBUG_FILTER_STEPS] After formatting: ${formattedPokemon.length} Pokemon`);
      
      // Apply generation filtering if needed
      let filteredByGeneration = formattedPokemon;
      if (selectedGeneration > 0) {
        const genRanges = {
          1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
          5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
        };
        const [min, max] = genRanges[selectedGeneration as keyof typeof genRanges] || [0, 9999];
        filteredByGeneration = formattedPokemon.filter(p => p.id >= min && p.id <= max);
        console.log(`🔒 [DEBUG_FILTER_STEPS] After gen ${selectedGeneration} filtering: ${filteredByGeneration.length} Pokemon`);
      }
      
      // Get TrueSkill ranked Pokemon IDs to filter out from available
      const rankedPokemonIds = new Set(localRankings.map(p => p.id));
      console.log(`🔒 [DEBUG_FILTER_STEPS] TrueSkill ranked Pokemon count: ${rankedPokemonIds.size}`);
      
      // Split into available and ranked
      const availablePokemon = filteredByGeneration.filter(p => !rankedPokemonIds.has(p.id));
      const rankedPokemon = localRankings.filter(p => {
        if (selectedGeneration === 0) return true;
        const genRanges = {
          1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
          5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
        };
        const [min, max] = genRanges[selectedGeneration as keyof typeof genRanges] || [0, 9999];
        return p.id >= min && p.id <= max;
      });
      
      console.log(`🔒 [DEBUG_FILTER_STEPS] FINAL SPLIT:`);
      console.log(`🔒 [DEBUG_FILTER_STEPS] - Available Pokemon: ${availablePokemon.length}`);
      console.log(`🔒 [DEBUG_FILTER_STEPS] - Ranked Pokemon: ${rankedPokemon.length}`);
      console.log(`🔒 [DEBUG_FILTER_STEPS] - Total: ${availablePokemon.length + rankedPokemon.length}`);
      
      // Calculate pagination
      const totalPages = loadingType === "pagination" ? Math.ceil(availablePokemon.length / loadSize) : 1;
      
      console.log(`🔒 [DETERMINISTIC_DATA_FIXED] ✅ SUCCESS - Returning data with ${availablePokemon.length} available, ${rankedPokemon.length} ranked`);
      
      return {
        availablePokemon,
        rankedPokemon,
        totalPages
      };
      
    } catch (error) {
      console.error(`🔒 [DETERMINISTIC_DATA_FIXED] ❌ Error in getPokemonData:`, error);
      throw error;
    }
  }, [getAllPokemon, localRankings, contextPokemon]);

  return { getPokemonData };
};
