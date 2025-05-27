import { Pokemon, PokemonAPIResponse } from "../types";
import { getPreferredImageUrl } from "@/utils/imageUtils";

const POKEMON_API_BASE = "https://pokeapi.co/api/v2";

// More specific filter for Cramorant forms - only exclude the ones the user mentioned
const isCramorantFormToExclude = (pokemon: any): boolean => {
  if (pokemon.id !== 845) return false; // Not Cramorant at all
  
  // Keep base Cramorant (regular form)
  if (!pokemon.name.includes('-')) return false;
  
  // Only exclude these specific forms the user mentioned
  const formsToExclude = ['cramorant-gulping', 'cramorant-gorging'];
  return formsToExclude.includes(pokemon.name);
};

// CRITICAL: Add logging for refresh detection
let lastFetchCallCount = 0;
let fetchCallTimestamps: string[] = [];

export const fetchAllPokemon = async (
  generationId = 0,
  fullRankingMode = true,
  initialBatchOnly = false,
  batchSize = 150
): Promise<Pokemon[]> => {
  lastFetchCallCount++;
  const currentCallId = lastFetchCallCount;
  const timestamp = new Date().toISOString();
  
  fetchCallTimestamps.push(timestamp);
  // Keep only last 10 timestamps
  if (fetchCallTimestamps.length > 10) {
    fetchCallTimestamps = fetchCallTimestamps.slice(-10);
  }
  
  console.log(`🚨 [REFRESH_DETECTION] fetchAllPokemon call #${currentCallId} at ${timestamp}`);
  console.log(`🚨 [REFRESH_DETECTION] Recent fetch calls:`, fetchCallTimestamps);
  
  // CRITICAL: Detect rapid successive calls (possible refresh)
  if (fetchCallTimestamps.length >= 2) {
    const lastTwo = fetchCallTimestamps.slice(-2);
    const timeDiff = new Date(lastTwo[1]).getTime() - new Date(lastTwo[0]).getTime();
    if (timeDiff < 1000) { // Less than 1 second apart
      console.error(`🔥 [REFRESH_DETECTION] RAPID FETCH CALLS DETECTED! Time diff: ${timeDiff}ms - POSSIBLE REFRESH!`);
    }
  }
  
  console.log(`🔍 [REFRESH_DETECTION] fetchAllPokemon parameters:`, {
    callId: currentCallId,
    generationId,
    fullRankingMode,
    initialBatchOnly,
    batchSize,
    timestamp
  });

  try {
    let limit = fullRankingMode ? 2000 : 1025;
    
    // CRITICAL: Log different batch modes
    if (initialBatchOnly) {
      limit = batchSize;
      console.log(`📦 [REFRESH_DETECTION] Call #${currentCallId}: INITIAL BATCH MODE - limit: ${limit}`);
    } else {
      console.log(`📦 [REFRESH_DETECTION] Call #${currentCallId}: FULL LOAD MODE - limit: ${limit}`);
    }

    console.log(`🌐 [REFRESH_DETECTION] Call #${currentCallId}: Fetching from API with limit ${limit}`);
    
    const response = await fetch(`${POKEMON_API_BASE}/pokemon?limit=${limit}&offset=0`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PokemonAPIResponse = await response.json();
    console.log(`📥 [REFRESH_DETECTION] Call #${currentCallId}: API returned ${data.results.length} Pokemon`);
    
    // CRITICAL: Track processing milestones
    const startProcessingTime = Date.now();
    console.log(`⚙️ [REFRESH_DETECTION] Call #${currentCallId}: Starting Pokemon processing at ${new Date(startProcessingTime).toISOString()}`);

    const pokemonPromises = data.results.map(async (pokemonInfo, index) => {
      try {
        const response = await fetch(pokemonInfo.url);
        const pokemonData = await response.json();

        // CRITICAL: Log milestone numbers specifically
        if (index === 1024) {
          console.error(`🔥 [REFRESH_DETECTION] Call #${currentCallId}: PROCESSED 1025th POKEMON (index 1024) - MILESTONE HIT!`);
        }
        if (index === 1270) {
          console.error(`🔥 [REFRESH_DETECTION] Call #${currentCallId}: PROCESSED 1271st POKEMON (index 1270) - MILESTONE HIT!`);
        }

        // Filter out specific Cramorant forms only
        if (isCramorantFormToExclude(pokemonData)) {
          console.log(`🦅 [REFRESH_DETECTION] Call #${currentCallId}: Filtering out Cramorant form: ${pokemonData.name}`);
          return null;
        }

        // CRITICAL: Verify types are properly extracted
        const types = pokemonData.types?.map((type: any) => type.type.name) || [];
        if (types.length === 0) {
          console.error(`🚨 [TYPE_ERROR] Call #${currentCallId}: Pokemon ${pokemonData.name} has NO TYPES!`, pokemonData);
        }

        const pokemon: Pokemon = {
          id: pokemonData.id,
          name: pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1),
          image: getPreferredImageUrl(pokemonData.id),
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
        console.error(`❌ [REFRESH_DETECTION] Call #${currentCallId}: Error fetching pokemon ${pokemonInfo.name}:`, error);
        return null;
      }
    });

    const pokemonList = await Promise.all(pokemonPromises);
    const filteredList = pokemonList.filter((p): p is Pokemon => p !== null);
    
    const processingTime = Date.now() - startProcessingTime;
    console.log(`✅ [REFRESH_DETECTION] Call #${currentCallId}: Processing completed in ${processingTime}ms`);
    console.log(`📊 [REFRESH_DETECTION] Call #${currentCallId}: Final result: ${filteredList.length} Pokemon (filtered from ${pokemonList.length})`);
    
    // CRITICAL: Log final count milestones
    if (filteredList.length === 1025) {
      console.error(`🔥 [REFRESH_DETECTION] Call #${currentCallId}: RETURNING EXACTLY 1025 POKEMON - MILESTONE!`);
    }
    if (filteredList.length === 1271) {
      console.error(`🔥 [REFRESH_DETECTION] Call #${currentCallId}: RETURNING EXACTLY 1271 POKEMON - MILESTONE!`);
    }

    return filteredList;
  } catch (error) {
    console.error(`❌ [REFRESH_DETECTION] Call #${currentCallId}: fetchAllPokemon failed:`, error);
    throw error;
  }
};
