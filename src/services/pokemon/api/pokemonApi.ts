
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

        // STEP 1: Log the exact raw name from the API
        console.log(`🔧 [STEP_1_RAW_API] Pokemon ID ${pokemonData.id}: Raw API name = "${pokemonData.name}"`);
        
        // STEP 2: Apply formatPokemonName and log the result
        const formattedName = formatPokemonName(pokemonData.name);
        console.log(`🔧 [STEP_2_FORMATTED] ID ${pokemonData.id}: "${pokemonData.name}" → "${formattedName}"`);
        
        // STEP 3: Check if formatting actually changed anything
        const nameChanged = pokemonData.name !== formattedName;
        console.log(`🔧 [STEP_3_CHANGE_CHECK] ID ${pokemonData.id}: Name changed = ${nameChanged}`);

        const pokemon = {
          id: pokemonData.id,
          name: formattedName, // Use the formatted name directly
          image: pokemonData.sprites.other['official-artwork'].front_default || 
                 pokemonData.sprites.front_default,
          types: pokemonData.types.map((type: any) => 
            type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
          )
        };

        // STEP 4: Log the final Pokemon object that will be returned
        console.log(`🔧 [STEP_4_FINAL_OBJECT] ID ${pokemon.id}: Final Pokemon name = "${pokemon.name}"`);
        
        return pokemon;
      } catch (error) {
        console.error(`Error fetching Pokemon ${species.name}:`, error);
        return null;
      }
    });

    const pokemonResults = await Promise.all(pokemonPromises);
    const validPokemon = pokemonResults.filter(pokemon => pokemon !== null);

    console.log(`✅ Successfully loaded ${validPokemon.length} Pokemon (filtered out ALL Cramorant forms)`);
    
    // STEP 5: Log a sample of the final results to see what we're actually returning
    const samplePokemon = validPokemon.slice(0, 5);
    console.log(`🔧 [STEP_5_FINAL_SAMPLE] Sample of first 5 Pokemon names in final result:`, 
      samplePokemon.map(p => `"${p.name}" (ID: ${p.id})`));
    
    return validPokemon;

  } catch (error) {
    console.error("Error fetching Pokemon data:", error);
    throw error;
  }
};

export const fetchAllPokemon = async (): Promise<Pokemon[]> => {
  return fetchPokemonData([1, 2, 3, 4, 5, 6, 7, 8, 9]);
};
