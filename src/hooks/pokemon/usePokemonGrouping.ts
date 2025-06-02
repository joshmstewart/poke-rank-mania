
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { groupPokemonByGeneration, createFlatPokemonList } from "./pokemonGrouping";

// Main hook function with FIXED logic to catch ALL Pokemon
export const usePokemonGrouping = (
  pokemonList: Pokemon[],
  searchTerm: string,
  isRankingArea: boolean,
  isGenerationExpanded?: (genId: number) => boolean
) => {
  return useMemo(() => {
    console.log(`🔍 [POKEMON_GROUPING] Processing ${pokemonList.length} Pokemon, search: "${searchTerm}", isRankingArea: ${isRankingArea}`);
    
    // First filter by search term
    const filtered = pokemonList.filter(pokemon => 
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`🔍 [POKEMON_GROUPING] After search filter: ${filtered.length} Pokemon`);
    
    // FIXED: Only return flat list for ranking area, not for available Pokemon area when searching
    if (isRankingArea) {
      return createFlatPokemonList(filtered);
    }
    
    // For available Pokemon area, always group by generation (even when searching)
    return groupPokemonByGeneration(filtered, isGenerationExpanded);
  }, [pokemonList, searchTerm, isRankingArea, isGenerationExpanded]);
};
