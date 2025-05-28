
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

        // ULTRA-DETAILED LOGGING: Track every step of name processing
        console.log(`🔧 [API_NAME_PROCESSING] ===== PROCESSING POKEMON ${pokemonData.id} =====`);
        console.log(`🔧 [API_NAME_PROCESSING] Raw API name: "${pokemonData.name}"`);
        console.log(`🔧 [API_NAME_PROCESSING] Raw name type: ${typeof pokemonData.name}`);
        console.log(`🔧 [API_NAME_PROCESSING] Raw name length: ${pokemonData.name.length}`);
        console.log(`🔧 [API_NAME_PROCESSING] Raw name chars: [${pokemonData.name.split('').join(', ')}]`);
        
        // Check if this is a name that should be formatted
        const shouldFormat = pokemonData.name.includes('-');
        console.log(`🔧 [API_NAME_PROCESSING] Should format (contains hyphen): ${shouldFormat}`);
        
        if (shouldFormat) {
          console.log(`🔧 [API_NAME_PROCESSING] BEFORE formatPokemonName: "${pokemonData.name}"`);
          
          // Call formatPokemonName and track result
          const formattedName = formatPokemonName(pokemonData.name);
          
          console.log(`🔧 [API_NAME_PROCESSING] AFTER formatPokemonName: "${formattedName}"`);
          console.log(`🔧 [API_NAME_PROCESSING] Formatting changed name: ${pokemonData.name !== formattedName}`);
          console.log(`🔧 [API_NAME_PROCESSING] Final formatted name type: ${typeof formattedName}`);
          console.log(`🔧 [API_NAME_PROCESSING] Final formatted name length: ${formattedName.length}`);
          
          // Special check for G-Max Pokemon
          if (pokemonData.name.toLowerCase().includes('gmax')) {
            console.log(`🎯 [GMAX_SPECIFIC] GMAX Pokemon detected: "${pokemonData.name}"`);
            console.log(`🎯 [GMAX_SPECIFIC] Formatted result: "${formattedName}"`);
            console.log(`🎯 [GMAX_SPECIFIC] Contains "G-Max": ${formattedName.includes('G-Max')}`);
            console.log(`🎯 [GMAX_SPECIFIC] Still contains hyphen: ${formattedName.includes('-')}`);
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

          console.log(`🔧 [API_NAME_PROCESSING] Final Pokemon object name: "${pokemon.name}"`);
          console.log(`🔧 [API_NAME_PROCESSING] ===== END PROCESSING POKEMON ${pokemonData.id} =====`);
          
          return pokemon;
        } else {
          // No formatting needed
          const pokemon = {
            id: pokemonData.id,
            name: pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1), // Just capitalize
            image: pokemonData.sprites.other['official-artwork'].front_default || 
                   pokemonData.sprites.front_default,
            types: pokemonData.types.map((type: any) => 
              type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
            )
          };

          console.log(`🔧 [API_NAME_PROCESSING] No formatting needed for: "${pokemon.name}"`);
          return pokemon;
        }
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
      validPokemon.filter(p => 
        p.name.includes('-') && !p.name.includes('(') && !p.name.includes('Mega ') && !p.name.includes('Alolan ') && !p.name.includes('G-Max ')
      ).forEach(p => {
        console.error(`🚨 [API_UNFORMATTED] "${p.name}" (ID: ${p.id})`);
      });
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
