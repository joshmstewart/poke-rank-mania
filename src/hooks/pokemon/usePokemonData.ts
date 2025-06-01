import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "./types";
import { useFormFilters } from "@/hooks/form-filters/useFormFilters";
import { usePokemonService } from "@/hooks/pokemon/usePokemonService";
import { formatPokemonName } from "@/utils/pokemon";

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
    
    // CRITICAL FIX: Apply name formatting to ALL Pokemon before any other processing
    const formattedPokemon = allPokemon.map(pokemon => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name)
    }));
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] After name formatting: ${formattedPokemon.length}`);
    
    // Apply form filters
    const filteredPokemon = analyzeFilteringPipeline(formattedPokemon);
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] After form filtering: ${filteredPokemon.length}`);
    console.log(`🔥🔥🔥 [POKEMON_DATA_INVESTIGATION] POKEMON LOST IN FILTERING: ${formattedPokemon.length - filteredPokemon.length}`);
    
    // Apply generation filter if needed - FIXED LOGIC
    let generationFiltered = filteredPokemon;
    if (selectedGeneration > 0) {
      generationFiltered = filteredPokemon.filter(pokemon => {
        // CRITICAL FIX: Use proper generation logic that considers base Pokemon
        let gen: number;
        let baseId = pokemon.id;
        
        // For high IDs (variants/forms), try to map to base Pokemon generation
        if (pokemon.id > 1025) {
          // Try modulo operations to find base ID
          const mod1000 = pokemon.id % 1000;
          const mod10000 = pokemon.id % 10000;
          
          if (mod1000 >= 1 && mod1000 <= 1025) {
            baseId = mod1000;
          } else if (mod10000 >= 1 && mod10000 <= 1025) {
            baseId = mod10000;
          } else {
            // For special cases, keep original ID
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
          // For completely unknown IDs, default to latest generation
          gen = 9;
        }
        
        const matches = gen === selectedGeneration;
        if (matches) {
          console.log(`🔥🔥🔥 [GEN_FILTER] ${pokemon.name} (ID: ${pokemon.id}, baseId: ${baseId}) -> Gen ${gen} (INCLUDED)`);
        }
        
        return matches;
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
