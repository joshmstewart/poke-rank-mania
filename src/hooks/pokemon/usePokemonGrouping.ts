
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { getPokemonGeneration, generationDetails } from "@/components/pokemon/generationUtils";

export const usePokemonGrouping = (
  pokemonList: Pokemon[],
  searchTerm: string,
  isRankingArea: boolean,
  isGenerationExpanded?: (genId: number) => boolean
) => {
  return useMemo(() => {
    // First filter by search term
    const filtered = pokemonList.filter(pokemon => 
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // If this is the ranking area or we're searching, don't group by generation
    if (isRankingArea || searchTerm) {
      return {
        items: filtered.map(pokemon => ({ type: 'pokemon', data: pokemon })),
        showGenerationHeaders: false
      };
    }
    
    // Group by generation for the available Pokemon list
    const result = [];
    let lastGeneration: number | null = null;
    
    for (const pokemon of filtered) {
      const generation = getPokemonGeneration(pokemon.id);
      
      if (generation && generation.id !== lastGeneration) {
        // Add a header for new generation
        result.push({ 
          type: 'header', 
          generationId: generation.id,
          data: {
            name: generation.name,
            region: generationDetails[generation.id]?.region || "Unknown",
            games: generationDetails[generation.id]?.games || ""
          }
        });
        lastGeneration = generation.id;
      }
      
      // Only add the Pokemon if its generation is expanded (or if no expansion function provided)
      if (!isGenerationExpanded || isGenerationExpanded(generation?.id || 0)) {
        result.push({ type: 'pokemon', data: pokemon });
      }
    }
    
    return {
      items: result,
      showGenerationHeaders: true
    };
  }, [pokemonList, searchTerm, isRankingArea, isGenerationExpanded]);
};
