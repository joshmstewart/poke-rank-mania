
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "./types";
import { useFormFilters } from "@/hooks/form-filters/useFormFilters";
import { usePokemonService } from "@/hooks/pokemon/usePokemonService";

export const usePokemonData = () => {
  const { analyzeFilteringPipeline } = useFormFilters();
  const { getAllPokemon } = usePokemonService();

  const getPokemonData = useCallback(async (
    selectedGeneration: number,
    currentPage: number,
    loadSize: number,
    loadingType: LoadingType
  ) => {
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] ===== GET POKEMON DATA =====`);
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] Params: gen=${selectedGeneration}, page=${currentPage}, size=${loadSize}, type=${loadingType}`);
    
    // Get ALL Pokemon first
    const allPokemon = await getAllPokemon();
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] Raw Pokemon from service: ${allPokemon.length}`);
    
    // Apply form filters - THIS IS WHERE POKEMON MIGHT BE GETTING LOST
    const filteredPokemon = analyzeFilteringPipeline(allPokemon);
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] After form filtering: ${filteredPokemon.length}`);
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] POKEMON LOST IN FILTERING: ${allPokemon.length - filteredPokemon.length}`);
    
    // Apply generation filter if needed
    let generationFiltered = filteredPokemon;
    if (selectedGeneration > 0) {
      generationFiltered = filteredPokemon.filter(pokemon => {
        // Use the same ID-based generation logic as in the grouping hook
        let gen: number;
        if (pokemon.id <= 151) gen = 1;
        else if (pokemon.id <= 251) gen = 2;
        else if (pokemon.id <= 386) gen = 3;
        else if (pokemon.id <= 493) gen = 4;
        else if (pokemon.id <= 649) gen = 5;
        else if (pokemon.id <= 721) gen = 6;
        else if (pokemon.id <= 809) gen = 7;
        else if (pokemon.id <= 905) gen = 8;
        else if (pokemon.id <= 1025) gen = 9;
        else {
          // For variants, try to map to base ID
          const baseId = pokemon.id % 1000;
          if (baseId <= 151) gen = 1;
          else if (baseId <= 251) gen = 2;
          else if (baseId <= 386) gen = 3;
          else if (baseId <= 493) gen = 4;
          else if (baseId <= 649) gen = 5;
          else if (baseId <= 721) gen = 6;
          else if (baseId <= 809) gen = 7;
          else if (baseId <= 905) gen = 8;
          else gen = 9;
        }
        return gen === selectedGeneration;
      });
      console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] After generation filter (gen ${selectedGeneration}): ${generationFiltered.length}`);
    }
    
    // For manual ranking mode, return all Pokemon as available initially
    const totalPages = Math.ceil(generationFiltered.length / loadSize);
    
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] FINAL RESULT:`);
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] Available: ${generationFiltered.length}`);
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] Ranked: 0 (manual mode starts empty)`);
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] Total pages: ${totalPages}`);
    
    return {
      availablePokemon: generationFiltered,
      rankedPokemon: [], // Manual mode starts with empty rankings
      totalPages
    };
  }, [analyzeFilteringPipeline, getAllPokemon]);

  return { getPokemonData };
};
