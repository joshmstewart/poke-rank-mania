
import { Pokemon } from "@/services/pokemon";
import { getBasePokemonName } from "@/utils/pokemon/pokemonGenerationUtils";
import { baseGenerationMap } from "./generationMapping";
import { determineGenerationFromId } from "./generationUtils";
import { generationDetails } from "@/components/pokemon/generationUtils";

interface GroupingResult {
  items: any[];
  showGenerationHeaders: boolean;
}

// Main function to determine Pokemon generation using FIXED logic that catches ALL Pokemon
export const determinePokemonGeneration = (pokemon: Pokemon): number => {
  // Try exact name match first
  if (baseGenerationMap[pokemon.name.toLowerCase()]) {
    return baseGenerationMap[pokemon.name.toLowerCase()];
  }
  
  // Try base name match
  const baseName = getBasePokemonName(pokemon.name);
  if (baseGenerationMap[baseName.toLowerCase()]) {
    return baseGenerationMap[baseName.toLowerCase()];
  }
  
  // FALLBACK: Use ID-based determination - this catches ALL Pokemon
  return determineGenerationFromId(pokemon.id);
};

// Group Pokemon by generation for the available Pokemon area
export const groupPokemonByGeneration = (
  filteredPokemon: Pokemon[],
  isGenerationExpanded?: (genId: number) => boolean
): GroupingResult => {
  const generationGroups = new Map<number, Pokemon[]>();
  
  // Group Pokemon by generation using FIXED logic that catches ALL Pokemon
  filteredPokemon.forEach(pokemon => {
    const generation = determinePokemonGeneration(pokemon);
    
    console.log(`🔍 [POKEMON_GROUPING] ${pokemon.name} (ID: ${pokemon.id}) -> Generation ${generation}`);
    
    if (!generationGroups.has(generation)) {
      generationGroups.set(generation, []);
    }
    generationGroups.get(generation)!.push(pokemon);
  });
  
  // Build the result with headers and Pokemon
  const result = [];
  
  // Include all generations 1-9, even if some are empty
  for (let gen = 1; gen <= 9; gen++) {
    if (generationGroups.has(gen)) {
      const genDetails = generationDetails[gen];
      const pokemonInGen = generationGroups.get(gen) || [];
      
      console.log(`🔍 [POKEMON_GROUPING] Generation ${gen}: ${pokemonInGen.length} Pokemon`);
      
      // Add generation header
      result.push({ 
        type: 'header', 
        generationId: gen,
        data: {
          name: `Generation ${gen}`,
          region: genDetails?.region || "Unknown",
          games: genDetails?.games || ""
        }
      });
      
      // Add Pokemon if generation is expanded (or if no expansion function provided)
      if (!isGenerationExpanded || isGenerationExpanded(gen)) {
        pokemonInGen.forEach(pokemon => {
          result.push({ type: 'pokemon', data: pokemon });
        });
        console.log(`🔍 [POKEMON_GROUPING] Added ${pokemonInGen.length} Pokemon for expanded Generation ${gen}`);
      } else {
        console.log(`🔍 [POKEMON_GROUPING] Skipped ${pokemonInGen.length} Pokemon for collapsed Generation ${gen}`);
      }
    }
  }
  
  console.log(`🔍 [POKEMON_GROUPING] Generated ${result.length} items with headers for available Pokemon area`);
  
  return {
    items: result,
    showGenerationHeaders: true
  };
};

// Create flat list for ranking area
export const createFlatPokemonList = (filteredPokemon: Pokemon[]): GroupingResult => {
  console.log(`🔍 [POKEMON_GROUPING] Ranking area - returning flat list`);
  return {
    items: filteredPokemon.map(pokemon => ({ type: 'pokemon', data: pokemon })),
    showGenerationHeaders: false
  };
};
