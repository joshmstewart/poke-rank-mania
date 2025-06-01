
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
    console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] ===== DETERMINISTIC DATA PROCESSING =====`);
    console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] Input: gen=${selectedGeneration}, page=${currentPage}, size=${loadSize}, type=${loadingType}`);
    console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] Context Pokemon: ${contextPokemon?.length || 0}`);
    console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] TrueSkill rankings: ${localRankings?.length || 0}`);
    
    try {
      // CRITICAL FIX: Ensure we have valid context data
      if (!contextPokemon || !Array.isArray(contextPokemon) || contextPokemon.length === 0) {
        console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] ❌ No valid context data - returning deterministic empty result`);
        return {
          availablePokemon: [],
          rankedPokemon: [],
          totalPages: 0
        };
      }
      
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] ✅ Using Context data: ${contextPokemon.length} Pokemon`);
      
      // DETERMINISTIC: Sort by ID for absolute consistency
      const sortedPokemon = [...contextPokemon].sort((a, b) => a.id - b.id);
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] After deterministic sorting: ${sortedPokemon.length} Pokemon`);
      
      // DETERMINISTIC: Apply name formatting consistently
      const formattedPokemon = sortedPokemon.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] After deterministic formatting: ${formattedPokemon.length} Pokemon`);
      
      // DETERMINISTIC: Apply generation filtering if needed
      let filteredByGeneration = formattedPokemon;
      if (selectedGeneration > 0) {
        const genRanges = {
          1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
          5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
        };
        const [min, max] = genRanges[selectedGeneration as keyof typeof genRanges] || [0, 9999];
        filteredByGeneration = formattedPokemon.filter(p => p.id >= min && p.id <= max);
        console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] After deterministic gen ${selectedGeneration} filtering: ${filteredByGeneration.length} Pokemon`);
      }
      
      // DETERMINISTIC: Get TrueSkill ranked Pokemon IDs (sorted for consistency)
      const rankedPokemonIds = new Set((localRankings || []).map(p => p.id));
      const sortedRankedIds = Array.from(rankedPokemonIds).sort((a, b) => a - b);
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] TrueSkill ranked Pokemon (deterministic): ${sortedRankedIds.length}`);
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] Ranked IDs (first 10): ${sortedRankedIds.slice(0, 10).join(', ')}`);
      
      // DETERMINISTIC: Split into available and ranked with consistent ordering
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
      
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] DETERMINISTIC FINAL SPLIT:`);
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] - Available Pokemon: ${availablePokemon.length}`);
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] - Ranked Pokemon: ${rankedPokemon.length}`);
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] - Total should equal: ${filteredByGeneration.length}`);
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] - Verification: ${availablePokemon.length + rankedPokemon.length} = ${filteredByGeneration.length}? ${availablePokemon.length + rankedPokemon.length === filteredByGeneration.length ? '✅' : '❌'}`);
      
      // Calculate pagination deterministically
      const totalPages = loadingType === "pagination" ? Math.ceil(availablePokemon.length / loadSize) : 1;
      
      console.log(`🔒 [POKEMON_DATA_DETERMINISTIC] ✅ DETERMINISTIC SUCCESS - Available: ${availablePokemon.length}, Ranked: ${rankedPokemon.length}, Pages: ${totalPages}`);
      
      return {
        availablePokemon,
        rankedPokemon,
        totalPages
      };
      
    } catch (error) {
      console.error(`🔒 [POKEMON_DATA_DETERMINISTIC] ❌ Error in deterministic getPokemonData:`, error);
      return {
        availablePokemon: [],
        rankedPokemon: [],
        totalPages: 0
      };
    }
  }, [contextPokemon, localRankings]);

  return { getPokemonData };
};
