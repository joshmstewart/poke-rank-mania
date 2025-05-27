
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

        // ULTRA-DETAILED NAME PROCESSING LOGS
        console.log(`🔧 [ULTRA_NAME_DEBUG] ===== POKEMON ID ${pokemonData.id} COMPLETE PROCESSING =====`);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 1A - Raw API response name:`, pokemonData.name);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 1B - Raw name type:`, typeof pokemonData.name);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 1C - Raw name length:`, pokemonData.name.length);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 1D - Raw name contains hyphen:`, pokemonData.name.includes('-'));
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 1E - Raw name starts with mega:`, pokemonData.name.toLowerCase().startsWith('mega'));
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 1F - Raw name contains alola:`, pokemonData.name.toLowerCase().includes('alola'));
        
        // STEP 2: Call formatPokemonName and capture EXACT result
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 2A - About to call formatPokemonName("${pokemonData.name}")`);
        const formattedName = formatPokemonName(pokemonData.name);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 2B - formatPokemonName returned:`, formattedName);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 2C - Formatted name type:`, typeof formattedName);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 2D - Formatted name length:`, formattedName.length);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 2E - Names are identical:`, pokemonData.name === formattedName);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 2F - Names are similar (case insensitive):`, pokemonData.name.toLowerCase() === formattedName.toLowerCase());
        
        // STEP 3: Character-by-character comparison if they're different
        if (pokemonData.name !== formattedName) {
          console.log(`🔧 [ULTRA_NAME_DEBUG] Step 3A - NAMES DIFFER! Character comparison:`);
          console.log(`🔧 [ULTRA_NAME_DEBUG] Step 3B - Original: [${pokemonData.name.split('').join(', ')}]`);
          console.log(`🔧 [ULTRA_NAME_DEBUG] Step 3C - Formatted: [${formattedName.split('').join(', ')}]`);
          
          for (let i = 0; i < Math.max(pokemonData.name.length, formattedName.length); i++) {
            const origChar = pokemonData.name[i] || '(undefined)';
            const formChar = formattedName[i] || '(undefined)';
            if (origChar !== formChar) {
              console.log(`🔧 [ULTRA_NAME_DEBUG] Step 3D - Difference at position ${i}: "${origChar}" vs "${formChar}"`);
            }
          }
        } else {
          console.error(`🚨 [ULTRA_NAME_DEBUG] Step 3E - CRITICAL: formatPokemonName did NOT change "${pokemonData.name}" - this should have been formatted!`);
        }

        // STEP 4: Create the Pokemon object
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 4A - Creating Pokemon object with name:`, formattedName);
        const pokemon = {
          id: pokemonData.id,
          name: formattedName, // Use the formatted name directly
          image: pokemonData.sprites.other['official-artwork'].front_default || 
                 pokemonData.sprites.front_default,
          types: pokemonData.types.map((type: any) => 
            type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
          )
        };

        // STEP 5: Verify the Pokemon object
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 5A - Final Pokemon object name property:`, pokemon.name);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 5B - Pokemon object name is string:`, typeof pokemon.name === 'string');
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 5C - Pokemon object name length:`, pokemon.name.length);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 5D - Object property enumeration:`, Object.keys(pokemon));
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 5E - Name property descriptor:`, Object.getOwnPropertyDescriptor(pokemon, 'name'));
        
        // STEP 6: Final verification before return
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 6A - About to return Pokemon object for ID ${pokemonData.id}`);
        console.log(`🔧 [ULTRA_NAME_DEBUG] Step 6B - Return value name:`, pokemon.name);
        console.log(`🔧 [ULTRA_NAME_DEBUG] ===== END PROCESSING FOR ID ${pokemonData.id} =====`);
        
        return pokemon;
      } catch (error) {
        console.error(`Error fetching Pokemon ${species.name}:`, error);
        return null;
      }
    });

    const pokemonResults = await Promise.all(pokemonPromises);
    const validPokemon = pokemonResults.filter(pokemon => pokemon !== null);

    console.log(`✅ Successfully loaded ${validPokemon.length} Pokemon (filtered out ALL Cramorant forms)`);
    
    // ULTRA-DETAILED FINAL RESULT VERIFICATION
    console.log(`🔧 [ULTRA_NAME_DEBUG] ===== FINAL API RESULT VERIFICATION =====`);
    const samplePokemon = validPokemon.slice(0, 10);
    samplePokemon.forEach((pokemon, index) => {
      console.log(`🔧 [ULTRA_NAME_DEBUG] Final result #${index}: ID=${pokemon.id}, name="${pokemon.name}", nameType=${typeof pokemon.name}`);
      if (pokemon.name.includes('-') && !pokemon.name.includes('(') && !pokemon.name.includes('Mega ') && !pokemon.name.includes('Alolan ')) {
        console.error(`🚨 [ULTRA_NAME_DEBUG] UNFORMATTED NAME DETECTED IN FINAL RESULT: "${pokemon.name}" (ID: ${pokemon.id})`);
      }
    });
    
    // CRITICAL: Check if any Pokemon still have unformatted names in the final result
    const unformattedPokemon = validPokemon.filter(p => 
      p.name.includes('-') && !p.name.includes('(') && !p.name.includes('Mega ') && !p.name.includes('Alolan ')
    );
    
    console.log(`🔧 [ULTRA_NAME_DEBUG] Total unformatted Pokemon in final result: ${unformattedPokemon.length}`);
    if (unformattedPokemon.length > 0) {
      console.error(`🚨 [ULTRA_NAME_DEBUG] CRITICAL: ${unformattedPokemon.length} Pokemon still have unformatted names in final result!`);
      unformattedPokemon.slice(0, 5).forEach(p => {
        console.error(`🚨 [ULTRA_NAME_DEBUG] Unformatted: "${p.name}" (ID: ${p.id})`);
      });
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
