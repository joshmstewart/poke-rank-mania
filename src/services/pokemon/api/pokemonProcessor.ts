
import { Pokemon } from "../types";
import { getPokemonImageUrl } from "./utils";
import { isCramorantFormToExclude } from "./pokemonFilters";

export const processPokemonData = async (
  pokemonResults: any[],
  callId: number
): Promise<Pokemon[]> => {
  // ENHANCED: Track specific Pokemon forms with better detection
  const furfrowFormsFound: string[] = [];
  const alcremieFormsFound: string[] = [];
  const allPokemonNames: string[] = [];
  
  // CRITICAL: Track processing milestones
  const startProcessingTime = Date.now();
  console.log(`⚙️ [REFRESH_DETECTION] Call #${callId}: Starting Pokemon processing at ${new Date(startProcessingTime).toISOString()}`);

  const pokemonPromises = pokemonResults.map(async (pokemonInfo, index) => {
    try {
      const response = await fetch(pokemonInfo.url);
      const pokemonData = await response.json();

      // NEW: Log every Pokemon name and ID for debugging
      allPokemonNames.push(`${pokemonData.name} (ID: ${pokemonData.id})`);
      
      // ENHANCED: More comprehensive Furfrou detection
      if (pokemonData.id === 676 || pokemonData.name.toLowerCase().includes('furfrou')) {
        furfrowFormsFound.push(`${pokemonData.name} (ID: ${pokemonData.id})`);
        console.log(`🐩 [FURFROU_DEBUG] ✅ FOUND Furfrou form: "${pokemonData.name}" (ID: ${pokemonData.id})`);
      }
      
      // ENHANCED: More comprehensive Alcremie detection  
      if (pokemonData.id === 869 || pokemonData.name.toLowerCase().includes('alcremie')) {
        alcremieFormsFound.push(`${pokemonData.name} (ID: ${pokemonData.id})`);
        console.log(`🍰 [ALCREMIE_DEBUG] ✅ FOUND Alcremie form: "${pokemonData.name}" (ID: ${pokemonData.id})`);
      }

      // CRITICAL: Log milestone numbers specifically
      if (index === 1024) {
        console.error(`🔥 [REFRESH_DETECTION] Call #${callId}: PROCESSED 1025th POKEMON (index 1024) - MILESTONE HIT!`);
      }
      if (index === 1270) {
        console.error(`🔥 [REFRESH_DETECTION] Call #${callId}: PROCESSED 1271st POKEMON (index 1270) - MILESTONE HIT!`);
      }

      // Filter out specific Cramorant forms only
      if (isCramorantFormToExclude(pokemonData)) {
        console.log(`🦅 [REFRESH_DETECTION] Call #${callId}: Filtering out Cramorant form: ${pokemonData.name}`);
        return null;
      }

      // CRITICAL: Verify types are properly extracted
      const types = pokemonData.types?.map((type: any) => type.type.name) || [];
      if (types.length === 0) {
        console.error(`🚨 [TYPE_ERROR] Call #${callId}: Pokemon ${pokemonData.name} has NO TYPES!`, pokemonData);
      }

      const pokemon: Pokemon = {
        id: pokemonData.id,
        name: pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1),
        image: getPokemonImageUrl(pokemonData.id),
        types: types,
        height: pokemonData.height,
        weight: pokemonData.weight,
        stats: pokemonData.stats.reduce((acc: any, stat: any) => {
          acc[stat.stat.name] = stat.base_stat;
          return acc;
        }, {}),
        generation: Math.ceil(pokemonData.id / 151) || 1
      };

      return pokemon;
    } catch (error) {
      console.error(`❌ [REFRESH_DETECTION] Call #${callId}: Error fetching pokemon ${pokemonInfo.name}:`, error);
      return null;
    }
  });

  const pokemonList = await Promise.all(pokemonPromises);
  const filteredList = pokemonList.filter((p): p is Pokemon => p !== null);
  
  // ENHANCED: Comprehensive logging with Pokemon name samples
  console.log(`🐩 [FURFROU_FINAL] Call #${callId}: Found ${furfrowFormsFound.length} Furfrou forms:`, furfrowFormsFound);
  console.log(`🍰 [ALCREMIE_FINAL] Call #${callId}: Found ${alcremieFormsFound.length} Alcremie forms:`, alcremieFormsFound);
  
  // Log some sample Pokemon names to verify we're getting the right data
  console.log(`📝 [POKEMON_SAMPLE] Call #${callId}: Sample of ALL Pokemon names (first 20):`, allPokemonNames.slice(0, 20));
  console.log(`📝 [POKEMON_SAMPLE] Call #${callId}: Sample of ALL Pokemon names (last 20):`, allPokemonNames.slice(-20));
  
  // Check specifically for Furfrou in the complete list
  const furfrowInList = allPokemonNames.filter(name => name.toLowerCase().includes('furfrou'));
  console.log(`🔍 [FURFROU_SEARCH] Call #${callId}: Searching all Pokemon names for 'furfrou':`, furfrowInList);
  
  if (furfrowFormsFound.length === 0) {
    console.error(`🚨 [FURFROU_MISSING] Call #${callId}: NO FURFROU FORMS FOUND IN RAW API DATA!`);
    console.error(`🚨 [FURFROU_MISSING] But found these in name search:`, furfrowInList);
  }
  
  if (alcremieFormsFound.length === 0) {
    console.error(`🚨 [ALCREMIE_MISSING] Call #${callId}: NO ALCREMIE FORMS FOUND IN RAW API DATA!`);
  }
  
  const processingTime = Date.now() - startProcessingTime;
  console.log(`✅ [REFRESH_DETECTION] Call #${callId}: Processing completed in ${processingTime}ms`);
  console.log(`📊 [REFRESH_DETECTION] Call #${callId}: Final result: ${filteredList.length} Pokemon (filtered from ${pokemonList.length})`);
  
  // CRITICAL: Log final count milestones
  if (filteredList.length === 1025) {
    console.error(`🔥 [REFRESH_DETECTION] Call #${callId}: RETURNING EXACTLY 1025 POKEMON - MILESTONE!`);
  }
  if (filteredList.length >= 1025) {
    console.log(`✅ [POKEMON_COUNT_SUCCESS] Call #${callId}: SUCCESS! Returning ${filteredList.length} Pokemon (>= 1025)`);
  } else {
    console.error(`🚨 [POKEMON_COUNT_ERROR] Call #${callId}: FAILURE! Only returning ${filteredList.length} Pokemon (< 1025)`);
  }

  return filteredList;
};
