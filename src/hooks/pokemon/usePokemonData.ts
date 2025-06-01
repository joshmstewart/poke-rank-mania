
import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { LoadingType } from "./types";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { formatPokemonName } from "@/utils/pokemon";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";

export const usePokemonData = () => {
  const { allPokemon: contextPokemon } = usePokemonContext();
  const { localRankings } = useTrueSkillSync();

  const getPokemonData = useCallback(async (
    selectedGeneration: number,
    currentPage: number,
    loadSize: number,
    loadingType: LoadingType
  ) => {
    console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] ===== FIXING AVAILABILITY REGRESSION =====`);
    console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] Params: gen=${selectedGeneration}, page=${currentPage}, size=${loadSize}, type=${loadingType}`);
    console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] Context Pokemon: ${contextPokemon?.length || 0}`);
    console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] TrueSkill rankings: ${localRankings?.length || 0}`);
    
    try {
      // CRITICAL FIX: Always use PokemonContext as the primary source
      if (!contextPokemon || !Array.isArray(contextPokemon) || contextPokemon.length === 0) {
        console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] ❌ No valid context data - returning empty result`);
        return {
          availablePokemon: [],
          rankedPokemon: [],
          totalPages: 0
        };
      }
      
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] ✅ Using Context data: ${contextPokemon.length} Pokemon`);
      
      // Sort by ID for consistency
      const sortedPokemon = [...contextPokemon].sort((a, b) => a.id - b.id);
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] After sorting: ${sortedPokemon.length} Pokemon`);
      
      // Apply name formatting
      const formattedPokemon = sortedPokemon.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] After formatting: ${formattedPokemon.length} Pokemon`);
      
      // Apply generation filtering if needed
      let filteredByGeneration = formattedPokemon;
      if (selectedGeneration > 0) {
        const genRanges = {
          1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
          5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
        };
        const [min, max] = genRanges[selectedGeneration as keyof typeof genRanges] || [0, 9999];
        filteredByGeneration = formattedPokemon.filter(p => p.id >= min && p.id <= max);
        console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] After gen ${selectedGeneration} filtering: ${filteredByGeneration.length} Pokemon`);
      }
      
      // Get TrueSkill ranked Pokemon IDs to filter out from available
      const rankedPokemonIds = new Set((localRankings || []).map(p => p.id));
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] TrueSkill ranked Pokemon count: ${rankedPokemonIds.size}`);
      
      // Split into available and ranked - CRITICAL: Use the filtered list properly
      const availablePokemon = filteredByGeneration.filter(p => !rankedPokemonIds.has(p.id));
      const rankedPokemon = (localRankings || []).filter(p => {
        if (selectedGeneration === 0) return true;
        const genRanges = {
          1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
          5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
        };
        const [min, max] = genRanges[selectedGeneration as keyof typeof genRanges] || [0, 9999];
        return p.id >= min && p.id <= max;
      });
      
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] FINAL SPLIT:`);
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] - Available Pokemon: ${availablePokemon.length}`);
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] - Ranked Pokemon: ${rankedPokemon.length}`);
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] - Total Context Pokemon: ${contextPokemon.length}`);
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] - After Generation Filter: ${filteredByGeneration.length}`);
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] - Ranked IDs to exclude: ${rankedPokemonIds.size}`);
      
      // Calculate pagination
      const totalPages = loadingType === "pagination" ? Math.ceil(availablePokemon.length / loadSize) : 1;
      
      console.log(`🔒 [POKEMON_DATA_CRITICAL_FIX] ✅ SUCCESS - Returning data with ${availablePokemon.length} available, ${rankedPokemon.length} ranked`);
      
      return {
        availablePokemon,
        rankedPokemon,
        totalPages
      };
      
    } catch (error) {
      console.error(`🔒 [POKEMON_DATA_CRITICAL_FIX] ❌ Error in getPokemonData:`, error);
      return {
        availablePokemon: [],
        rankedPokemon: [],
        totalPages: 0
      };
    }
  }, [contextPokemon, localRankings]);

  return { getPokemonData };
};
