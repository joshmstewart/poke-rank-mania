
import { formatPokemonName } from "@/utils/pokemon";

export interface RawPokemon {
  id: number;
  name: string;
  types?: { type: { name: string } }[];
  sprites?: {
    other?: {
      'official-artwork'?: {
        front_default?: string;
      };
    };
  };
}

export const processPokemonData = (rawPokemonList: RawPokemon[]) => {
  const allPokemon: any[] = [];
  const pokemonLookupMap = new Map();
  
  console.log(`🔧 [PROCESSOR] Processing ${rawPokemonList.length} raw Pokemon`);
  
  rawPokemonList.forEach(p => {
    // CRITICAL FIX: Only use formatPokemonName to check if Pokemon should be filtered
    // Do NOT store the formatted name - store the original raw name
    const formattedForFilter = formatPokemonName(p.name);
    
    if (formattedForFilter) { // Only include if not filtered out by the formatter
      // Store the Pokemon with its ORIGINAL, UNFORMATTED name
      const pokemonWithDetails = {
        ...p,
        name: p.name, // Use the original, raw name from the API
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
        types: p.types?.map(t => t.type.name) || []
      };
      
      allPokemon.push(pokemonWithDetails);
      pokemonLookupMap.set(p.id, pokemonWithDetails);
      
      // Debug logging for Deoxys forms
      if (p.name.toLowerCase().includes('deoxys')) {
        console.log(`🔧 [PROCESSOR] Storing Deoxys with RAW name: "${p.name}"`);
      }
    } else {
      console.log(`🔧 [PROCESSOR] Filtering out Pokemon: "${p.name}"`);
    }
  });
  
  console.log(`🔧 [PROCESSOR] Final count: ${allPokemon.length} Pokemon stored with raw names`);
  
  return { allPokemon, pokemonLookupMap };
};
