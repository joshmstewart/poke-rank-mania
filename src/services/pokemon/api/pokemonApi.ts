import { Pokemon } from "../types";
import { formatPokemonName } from "@/utils/pokemon";

const API_BASE = "https://pokeapi.co/api/v2";

export const fetchPokemonData = async (generations: number[]): Promise<Pokemon[]> => {
  try {
    console.log("🔍 Fetching Pokemon data for generations:", generations);
    
    const responses = await Promise.all(
      generations.map(gen => 
        fetch(`${API_BASE}/generation/${gen}`)
          .then(res => res.json())
      )
    );

    const allSpecies = responses.flatMap(response => 
      response.pokemon_species || []
    );

    console.log(`📊 Found ${allSpecies.length} Pokemon species across generations`);

    // Fetch detailed data for each Pokemon
    const pokemonPromises = allSpecies.map(async (species: any) => {
      try {
        const pokemonId = species.url.split('/').filter(Boolean).pop();
        const pokemonResponse = await fetch(`${API_BASE}/pokemon/${pokemonId}`);
        const pokemonData = await pokemonResponse.json();
        
        // ENHANCED CRAMORANT FILTERING: Filter out ALL Cramorant forms completely
        const isCramorantForm = pokemonData.name.toLowerCase().includes('cramorant');
        
        if (isCramorantForm) {
          console.log(`🚫 [CRAMORANT_FILTER] Filtering out ALL Cramorant forms: ${pokemonData.name}`);
          return null;
        }

        // CRITICAL FIX: Ensure formatting is applied immediately and consistently
        console.log(`🔧 [API_FORMAT_DEBUG] Raw API name: "${pokemonData.name}"`);
        
        // Format the name immediately
        const formattedName = formatPokemonName(pokemonData.name);
        console.log(`🔧 [API_FORMAT_DEBUG] Formatted name: "${formattedName}"`);
        
        // VERIFICATION: Check if formatting worked
        if (pokemonData.name === formattedName && pokemonData.name.includes('-')) {
          console.error(`🚨 [API_FORMAT_ERROR] Formatting failed for "${pokemonData.name}" - still contains hyphens`);
        } else {
          console.log(`✅ [API_FORMAT_SUCCESS] Successfully formatted "${pokemonData.name}" → "${formattedName}"`);
        }

        const pokemon = {
          id: pokemonData.id,
          name: formattedName, // Use the formatted name
          image: pokemonData.sprites.other['official-artwork'].front_default || 
                 pokemonData.sprites.front_default,
          types: pokemonData.types.map((type: any) => 
            type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
          )
        };

        console.log(`🔧 [API_FINAL_DEBUG] Final Pokemon object name: "${pokemon.name}"`);
        
        return pokemon;
      } catch (error) {
        console.error(`Error fetching Pokemon ${species.name}:`, error);
        return null;
      }
    });

    const pokemonResults = await Promise.all(pokemonPromises);
    const validPokemon = pokemonResults.filter(pokemon => pokemon !== null);

    console.log(`✅ Successfully loaded ${validPokemon.length} Pokemon with formatted names`);
    
    // VERIFICATION: Check final result for unformatted names
    const unformattedCount = validPokemon.filter(p => 
      p.name.includes('-') && !p.name.includes('(') && !p.name.includes('Mega ') && !p.name.includes('Alolan ') && !p.name.includes('G-Max ')
    ).length;
    
    if (unformattedCount > 0) {
      console.error(`🚨 [API_FINAL_ERROR] ${unformattedCount} Pokemon still have unformatted names!`);
    } else {
      console.log(`✅ [API_FINAL_SUCCESS] All Pokemon names properly formatted`);
    }
    
    return validPokemon;

  } catch (error) {
    console.error("Error fetching Pokemon data:", error);
    throw error;
  }
};

export const fetchAllPokemon = async (): Promise<Pokemon[]> => {
  return fetchPokemonData([1, 2, 3, 4, 5, 6, 7, 8, 9]);
};
