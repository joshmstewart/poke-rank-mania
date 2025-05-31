
import { Pokemon } from "../types";
import { formatPokemonName } from "@/utils/pokemon";

const API_BASE = "https://pokeapi.co/api/v2";

export const fetchPokemonData = async (generations: number[]): Promise<Pokemon[]> => {
  try {
    console.log("🔍🔍🔍 [API_FETCH_DEBUG] ===== STARTING POKEMON FETCH =====");
    console.log("🔍🔍🔍 [API_FETCH_DEBUG] Fetching Pokemon data for generations:", generations);
    
    const responses = await Promise.all(
      generations.map(async gen => {
        console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Fetching generation ${gen}...`);
        const response = await fetch(`${API_BASE}/generation/${gen}`);
        const data = await response.json();
        console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Generation ${gen} returned ${data.pokemon_species?.length || 0} species`);
        return data;
      })
    );

    const allSpecies = responses.flatMap(response => 
      response.pokemon_species || []
    );

    console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Total species found across all generations: ${allSpecies.length}`);

    // Sample some species to see what we're getting
    if (allSpecies.length > 0) {
      const sampleSpecies = allSpecies.slice(0, 10).map(s => {
        const id = s.url.split('/').filter(Boolean).pop();
        return `${s.name}(${id})`;
      });
      console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Sample species: ${sampleSpecies.join(', ')}`);
      
      // Check the ID range of all species
      const allIds = allSpecies.map(s => parseInt(s.url.split('/').filter(Boolean).pop()));
      const minId = Math.min(...allIds);
      const maxId = Math.max(...allIds);
      console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Species ID range: ${minId} - ${maxId}`);
    }

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

    console.log(`🔍🔍🔍 [API_FETCH_DEBUG] ===== FETCH COMPLETE =====`);
    console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Successfully loaded ${validPokemon.length} Pokemon with formatted names`);
    
    // CRITICAL: Check the final ID distribution
    if (validPokemon.length > 0) {
      const finalIds = validPokemon.map(p => p.id);
      const finalMinId = Math.min(...finalIds);
      const finalMaxId = Math.max(...finalIds);
      console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Final Pokemon ID range: ${finalMinId} - ${finalMaxId}`);
      
      const finalDistribution = {
        'Gen1(1-151)': finalIds.filter(id => id >= 1 && id <= 151).length,
        'Gen2(152-251)': finalIds.filter(id => id >= 152 && id <= 251).length,
        'Gen3(252-386)': finalIds.filter(id => id >= 252 && id <= 386).length,
        'Gen4(387-493)': finalIds.filter(id => id >= 387 && id <= 493).length,
        'Gen5(494-649)': finalIds.filter(id => id >= 494 && id <= 649).length,
        'Gen6(650-721)': finalIds.filter(id => id >= 650 && id <= 721).length,
        'Gen7(722-809)': finalIds.filter(id => id >= 722 && id <= 809).length,
        'Gen8(810-905)': finalIds.filter(id => id >= 810 && id <= 905).length,
        'Gen9(906+)': finalIds.filter(id => id >= 906).length,
      };
      console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Final generation distribution:`, finalDistribution);
    }
    
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
    console.error("🔍🔍🔍 [API_FETCH_DEBUG] Error fetching Pokemon data:", error);
    throw error;
  }
};

export const fetchAllPokemon = async (): Promise<Pokemon[]> => {
  console.log(`🔍🔍🔍 [API_FETCH_DEBUG] fetchAllPokemon called - will fetch generations 1-9`);
  return fetchPokemonData([1, 2, 3, 4, 5, 6, 7, 8, 9]);
};
