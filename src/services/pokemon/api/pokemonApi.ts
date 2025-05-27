
import { Pokemon } from "../types";
import { formatPokemonName } from "@/utils/pokemonUtils";

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

        // CRITICAL DEBUG: Log the EXACT raw name from API before any processing
        console.log(`🔧 [API_RAW_NAME_DEBUG] Pokemon ID ${pokemonData.id}: Raw API name = "${pokemonData.name}"`);
        
        // CRITICAL FIX: Apply formatPokemonName to the raw API name ONCE AND ONLY ONCE
        const formattedName = formatPokemonName(pokemonData.name);
        
        console.log(`🔧 [API_NAME_FORMATTING_DEBUG] ID ${pokemonData.id}: RAW "${pokemonData.name}" → FORMATTED "${formattedName}"`);

        const pokemon = {
          id: pokemonData.id,
          name: formattedName, // Use the formatted name directly
          image: pokemonData.sprites.other['official-artwork'].front_default || 
                 pokemonData.sprites.front_default,
          types: pokemonData.types.map((type: any) => 
            type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
          )
        };

        // Additional debug logging to confirm what we're returning
        console.log(`✅ [API_FINAL_POKEMON_DEBUG] ID ${pokemon.id}: Final Pokemon object name = "${pokemon.name}"`);
        
        return pokemon;
      } catch (error) {
        console.error(`Error fetching Pokemon ${species.name}:`, error);
        return null;
      }
    });

    const pokemonResults = await Promise.all(pokemonPromises);
    const validPokemon = pokemonResults.filter(pokemon => pokemon !== null);

    console.log(`✅ Successfully loaded ${validPokemon.length} Pokemon (filtered out ALL Cramorant forms)`);
    return validPokemon;

  } catch (error) {
    console.error("Error fetching Pokemon data:", error);
    throw error;
  }
};

export const fetchAllPokemon = async (): Promise<Pokemon[]> => {
  return fetchPokemonData([1, 2, 3, 4, 5, 6, 7, 8, 9]);
};
