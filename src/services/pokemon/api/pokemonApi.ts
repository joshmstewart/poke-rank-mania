
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
        
        // CRITICAL: Log each generation's species in detail
        if (data.pokemon_species && data.pokemon_species.length > 0) {
          const speciesIds = data.pokemon_species.map(s => {
            const id = parseInt(s.url.split('/').filter(Boolean).pop());
            return id;
          }).sort((a, b) => a - b);
          
          console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Gen ${gen} species ID range: ${speciesIds[0]} - ${speciesIds[speciesIds.length - 1]}`);
          console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Gen ${gen} first 10 species: ${data.pokemon_species.slice(0, 10).map(s => s.name).join(', ')}`);
        }
        
        return data;
      })
    );

    const allSpecies = responses.flatMap(response => 
      response.pokemon_species || []
    );

    console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Total species found across all generations: ${allSpecies.length}`);

    // CRITICAL: Check if we're missing generations or species
    if (allSpecies.length < 800) {
      console.error(`🚨🚨🚨 [API_FETCH_DEBUG] WARNING: Only ${allSpecies.length} species found - expected 1000+!`);
    }

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
      
      // CRITICAL: Check distribution by generation ranges
      const genDistribution = {
        'Gen1(1-151)': allIds.filter(id => id >= 1 && id <= 151).length,
        'Gen2(152-251)': allIds.filter(id => id >= 152 && id <= 251).length,
        'Gen3(252-386)': allIds.filter(id => id >= 252 && id <= 386).length,
        'Gen4(387-493)': allIds.filter(id => id >= 387 && id <= 493).length,
        'Gen5(494-649)': allIds.filter(id => id >= 494 && id <= 649).length,
        'Gen6(650-721)': allIds.filter(id => id >= 650 && id <= 721).length,
        'Gen7(722-809)': allIds.filter(id => id >= 722 && id <= 809).length,
        'Gen8(810-905)': allIds.filter(id => id >= 810 && id <= 905).length,
        'Gen9(906+)': allIds.filter(id => id >= 906).length,
      };
      console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Species distribution by generation:`, genDistribution);
    }

    // Fetch detailed data for each Pokemon
    console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Starting to fetch individual Pokemon data for ${allSpecies.length} species...`);
    
    const pokemonPromises = allSpecies.map(async (species: any, index: number) => {
      try {
        const pokemonId = species.url.split('/').filter(Boolean).pop();
        
        if (index % 100 === 0) {
          console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Processing Pokemon ${index}/${allSpecies.length} (ID: ${pokemonId})`);
        }
        
        const pokemonResponse = await fetch(`${API_BASE}/pokemon/${pokemonId}`);
        const pokemonData = await pokemonResponse.json();
        
        // ENHANCED CRAMORANT FILTERING: Filter out ALL Cramorant forms completely
        const isCramorantForm = pokemonData.name.toLowerCase().includes('cramorant');
        
        if (isCramorantForm) {
          console.log(`🚫 [CRAMORANT_FILTER] Filtering out ALL Cramorant forms: ${pokemonData.name}`);
          return null;
        }

        // Check if this is a name that should be formatted
        const shouldFormat = pokemonData.name.includes('-');
        
        if (shouldFormat) {
          const formattedName = formatPokemonName(pokemonData.name);
          
          const pokemon = {
            id: pokemonData.id,
            name: formattedName,
            image: pokemonData.sprites.other['official-artwork'].front_default || 
                   pokemonData.sprites.front_default,
            types: pokemonData.types.map((type: any) => 
              type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
            )
          };

          return pokemon;
        } else {
          // No formatting needed
          const pokemon = {
            id: pokemonData.id,
            name: pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1),
            image: pokemonData.sprites.other['official-artwork'].front_default || 
                   pokemonData.sprites.front_default,
            types: pokemonData.types.map((type: any) => 
              type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
            )
          };

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
    console.log(`🔍🔍🔍 [API_FETCH_DEBUG] Successfully loaded ${validPokemon.length} Pokemon out of ${allSpecies.length} species`);
    
    // CRITICAL: Final verification
    if (validPokemon.length < 1000) {
      console.error(`🚨🚨🚨 [API_FETCH_DEBUG] CRITICAL ERROR: Only ${validPokemon.length} Pokemon loaded - expected 1000+!`);
      console.error(`🚨🚨🚨 [API_FETCH_DEBUG] This indicates a problem with the generation data or API response`);
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
