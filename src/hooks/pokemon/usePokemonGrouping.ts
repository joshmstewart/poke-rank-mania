
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { getPokemonGeneration, generationDetails } from "@/components/pokemon/generationUtils";
import { getBasePokemonName } from "@/utils/pokemon/pokemonGenerationUtils";

// Function to determine generation based on Pokemon ID with better fallback logic
const determineGenerationFromId = (pokemonId: number): number => {
  // Standard generation ranges
  if (pokemonId >= 1 && pokemonId <= 151) return 1;
  if (pokemonId >= 152 && pokemonId <= 251) return 2;
  if (pokemonId >= 252 && pokemonId <= 386) return 3;
  if (pokemonId >= 387 && pokemonId <= 493) return 4;
  if (pokemonId >= 494 && pokemonId <= 649) return 5;
  if (pokemonId >= 650 && pokemonId <= 721) return 6;
  if (pokemonId >= 722 && pokemonId <= 809) return 7;
  if (pokemonId >= 810 && pokemonId <= 905) return 8;
  if (pokemonId >= 906 && pokemonId <= 1025) return 9;
  
  // For Pokemon with IDs outside normal ranges (variants, forms, etc.)
  // Try to map them based on the last 3-4 digits or patterns
  if (pokemonId > 10000) {
    // Very high IDs - try modulo 1000 first, then modulo 10000
    const mod1000 = pokemonId % 1000;
    const mod10000 = pokemonId % 10000;
    
    if (mod1000 >= 1 && mod1000 <= 1025) {
      return determineGenerationFromId(mod1000);
    }
    if (mod10000 >= 1 && mod10000 <= 1025) {
      return determineGenerationFromId(mod10000);
    }
  }
  
  // For IDs like 10001-10999, extract the base ID
  if (pokemonId >= 10000 && pokemonId < 11000) {
    const baseId = pokemonId - 10000;
    if (baseId >= 1 && baseId <= 1025) {
      return determineGenerationFromId(baseId);
    }
  }
  
  // Default to latest generation for unknown IDs
  return 9;
};

// Create a comprehensive mapping of base Pokemon names to their generations
const createBaseGenerationMap = () => {
  const map: Record<string, number> = {};
  
  // Gen 1 Pokemon (key ones to ensure mapping)
  const gen1Key = ['bulbasaur', 'charmander', 'squirtle', 'pikachu', 'charizard', 'blastoise', 'venusaur', 'mew', 'mewtwo'];
  gen1Key.forEach(name => map[name] = 1);
  
  // Gen 2 Pokemon (key ones)
  const gen2Key = ['chikorita', 'cyndaquil', 'totodile', 'lugia', 'ho-oh', 'celebi', 'corsola', 'wooper'];
  gen2Key.forEach(name => map[name] = 2);
  
  // Gen 3 Pokemon (key ones)
  const gen3Key = ['treecko', 'torchic', 'mudkip', 'rayquaza', 'kyogre', 'groudon'];
  gen3Key.forEach(name => map[name] = 3);
  
  // Gen 4 Pokemon (key ones)
  const gen4Key = ['turtwig', 'chimchar', 'piplup', 'dialga', 'palkia', 'giratina'];
  gen4Key.forEach(name => map[name] = 4);
  
  // Gen 5 Pokemon (key ones)
  const gen5Key = ['snivy', 'tepig', 'oshawott', 'reshiram', 'zekrom', 'kyurem', 'braviary'];
  gen5Key.forEach(name => map[name] = 5);
  
  // Gen 6 Pokemon (key ones)
  const gen6Key = ['chespin', 'fennekin', 'froakie', 'xerneas', 'yveltal', 'zygarde'];
  gen6Key.forEach(name => map[name] = 6);
  
  // Gen 7 Pokemon (key ones)
  const gen7Key = ['rowlet', 'litten', 'popplio', 'solgaleo', 'lunala', 'necrozma', 'decidueye'];
  gen7Key.forEach(name => map[name] = 7);
  
  // Gen 8 Pokemon (key ones)
  const gen8Key = ['grookey', 'scorbunny', 'sobble', 'zacian', 'zamazenta', 'eternatus'];
  gen8Key.forEach(name => map[name] = 8);
  
  // Gen 9 Pokemon (key ones)
  const gen9Key = ['sprigatito', 'fuecoco', 'quaxly', 'koraidon', 'miraidon', 'wooper-paldea'];
  gen9Key.forEach(name => map[name] = 9);
  
  return map;
};

// Create the mapping once
const baseGenerationMap = createBaseGenerationMap();

// Main hook function
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
    
    // Group Pokemon by generation using improved logic
    filtered.forEach(pokemon => {
      // Get the base name of the Pokemon (removing regional/form variants)
      const baseName = getBasePokemonName(pokemon.name);
      
      // Try to determine generation from the base Pokemon name first
      let generation: number | undefined = baseGenerationMap[baseName];
      
      // If we couldn't find the generation by name, use ID-based logic
      if (!generation) {
        generation = determineGenerationFromId(pokemon.id);
      }
      
      console.log(`🔍 [POKEMON_GROUPING] ${pokemon.name} (ID: ${pokemon.id}) -> Generation ${generation} (base: ${baseName})`);
      
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
    
    console.log(`🔍 [POKEMON_GROUPING] Generated ${result.length} items with headers for all generations`);
    
    return {
      items: result,
      showGenerationHeaders: true
    };
  }, [pokemonList, searchTerm, isRankingArea, isGenerationExpanded]);
};
