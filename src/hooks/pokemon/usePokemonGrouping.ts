
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
    
    // Group Pokemon by generation - using comprehensive logic
    filtered.forEach(pokemon => {
      let generation: number;
      
      // Use accurate generation boundaries based on National Dex numbers
      if (pokemon.id >= 1 && pokemon.id <= 151) generation = 1;
      else if (pokemon.id >= 152 && pokemon.id <= 251) generation = 2;
      else if (pokemon.id >= 252 && pokemon.id <= 386) generation = 3;
      else if (pokemon.id >= 387 && pokemon.id <= 493) generation = 4;
      else if (pokemon.id >= 494 && pokemon.id <= 649) generation = 5;
      else if (pokemon.id >= 650 && pokemon.id <= 721) generation = 6;
      else if (pokemon.id >= 722 && pokemon.id <= 809) generation = 7;
      else if (pokemon.id >= 810 && pokemon.id <= 905) generation = 8;
      else if (pokemon.id >= 906 && pokemon.id <= 1025) generation = 9;
      else {
        // For Pokemon with IDs > 1025, these are likely alternate forms
        // Try to map them to their base generation using the species ID pattern
        
        // Common patterns for alternate forms:
        // 10001-10999: Gen 1 forms
        // 20001-20999: Gen 2 forms, etc.
        if (pokemon.id >= 10001 && pokemon.id <= 10999) generation = 1;
        else if (pokemon.id >= 20001 && pokemon.id <= 20999) generation = 2;
        else if (pokemon.id >= 30001 && pokemon.id <= 30999) generation = 3;
        else if (pokemon.id >= 40001 && pokemon.id <= 40999) generation = 4;
        else if (pokemon.id >= 50001 && pokemon.id <= 50999) generation = 5;
        else if (pokemon.id >= 60001 && pokemon.id <= 60999) generation = 6;
        else if (pokemon.id >= 70001 && pokemon.id <= 70999) generation = 7;
        else if (pokemon.id >= 80001 && pokemon.id <= 80999) generation = 8;
        else if (pokemon.id >= 90001 && pokemon.id <= 90999) generation = 9;
        else {
          // For other high IDs, try to guess based on the last digits
          const lastThreeDigits = pokemon.id % 1000;
          if (lastThreeDigits >= 1 && lastThreeDigits <= 151) generation = 1;
          else if (lastThreeDigits >= 152 && lastThreeDigits <= 251) generation = 2;
          else if (lastThreeDigits >= 252 && lastThreeDigits <= 386) generation = 3;
          else if (lastThreeDigits >= 387 && lastThreeDigits <= 493) generation = 4;
          else if (lastThreeDigits >= 494 && lastThreeDigits <= 649) generation = 5;
          else if (lastThreeDigits >= 650 && lastThreeDigits <= 721) generation = 6;
          else if (lastThreeDigits >= 722 && lastThreeDigits <= 809) generation = 7;
          else if (lastThreeDigits >= 810 && lastThreeDigits <= 905) generation = 8;
          else generation = 9; // Default to latest generation
        }
      }
      
      console.log(`🔍 [POKEMON_GROUPING] ${pokemon.name} (ID: ${pokemon.id}) -> Generation ${generation}`);
      
      if (!generationGroups.has(generation)) {
        generationGroups.set(generation, []);
      }
      generationGroups.get(generation)!.push(pokemon);
    });
    
    // Build the result with headers and Pokemon
    const result = [];
    
    // Ensure we include all generations 1-9, even if some are empty
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
    
    console.log(`🔍 [POKEMON_GROUPING] Generated ${result.length} items with headers for all generations`);
    
    return {
      items: result,
      showGenerationHeaders: true
    };
  }, [pokemonList, searchTerm, isRankingArea, isGenerationExpanded]);
};
