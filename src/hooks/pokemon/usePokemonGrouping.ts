
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
    console.log(`🔍 [POKEMON_GROUPING] Processing ${pokemonList.length} Pokemon, search: "${searchTerm}", isRankingArea: ${isRankingArea}`);
    
    // First filter by search term
    const filtered = pokemonList.filter(pokemon => 
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`🔍 [POKEMON_GROUPING] After search filter: ${filtered.length} Pokemon`);
    
    // If this is the ranking area or we're searching, don't group by generation
    if (isRankingArea || searchTerm.trim()) {
      console.log(`🔍 [POKEMON_GROUPING] Not grouping - returning flat list`);
      return {
        items: filtered.map(pokemon => ({ type: 'pokemon', data: pokemon })),
        showGenerationHeaders: false
      };
    }
    
    // Group by generation for the available Pokemon list
    const generationGroups = new Map<number, Pokemon[]>();
    
    // Group Pokemon by generation
    filtered.forEach(pokemon => {
      let generation: number;
      if (pokemon.id <= 151) generation = 1;
      else if (pokemon.id <= 251) generation = 2;
      else if (pokemon.id <= 386) generation = 3;
      else if (pokemon.id <= 493) generation = 4;
      else if (pokemon.id <= 649) generation = 5;
      else if (pokemon.id <= 721) generation = 6;
      else if (pokemon.id <= 809) generation = 7;
      else if (pokemon.id <= 905) generation = 8;
      else generation = 9;
      
      if (!generationGroups.has(generation)) {
        generationGroups.set(generation, []);
      }
      generationGroups.get(generation)!.push(pokemon);
    });
    
    // Build the result with headers and Pokemon
    const result = [];
    const sortedGenerations = Array.from(generationGroups.keys()).sort();
    
    for (const generation of sortedGenerations) {
      const genDetails = generationDetails[generation];
      const pokemonInGen = generationGroups.get(generation) || [];
      
      // Add generation header
      result.push({ 
        type: 'header', 
        generationId: generation,
        data: {
          name: `Generation ${generation}`,
          region: genDetails?.region || "Unknown",
          games: genDetails?.games || ""
        }
      });
      
      // Add Pokemon if generation is expanded (or if no expansion function provided)
      if (!isGenerationExpanded || isGenerationExpanded(generation)) {
        pokemonInGen.forEach(pokemon => {
          result.push({ type: 'pokemon', data: pokemon });
        });
      }
    }
    
    console.log(`🔍 [POKEMON_GROUPING] Generated ${result.length} items with headers for ${sortedGenerations.length} generations`);
    
    return {
      items: result,
      showGenerationHeaders: true
    };
  }, [pokemonList, searchTerm, isRankingArea, isGenerationExpanded]);
};
