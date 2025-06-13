
import { Pokemon, PokemonAPIResponse } from "../types";
import { trackFetchCall, logFetchParameters } from "./fetchCallTracker";
import { processPokemonData } from "./pokemonProcessor";

const POKEMON_API_BASE = "https://pokeapi.co/api/v2";

export const fetchAllPokemon = async (
  generationId = 0,
  fullRankingMode = true,
  initialBatchOnly = false,
  batchSize = 150
): Promise<Pokemon[]> => {
  const currentCallId = trackFetchCall();
  logFetchParameters(currentCallId, generationId, fullRankingMode, initialBatchOnly, batchSize);

  try {
    // PROGRESSIVE LOADING: Start with smaller, more reliable batch sizes
    let limit = 150; // Default to 150 for better reliability
    
    if (initialBatchOnly) {
      limit = Math.min(batchSize, 200); // Cap at 200 even for initial batch
    } else if (fullRankingMode) {
      limit = 300; // Moderate increase for full ranking
    }

    console.log(`🌐 [FETCH_ALL] Call #${currentCallId}: Fetching ${limit} Pokemon from API`);
    
    // RETRY LOGIC: Add simple retry for network failures
    let response;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        response = await fetch(`${POKEMON_API_BASE}/pokemon?limit=${limit}&offset=0`);
        
        if (response.ok) {
          break; // Success, exit retry loop
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        retryCount++;
        console.log(`🔄 [FETCH_ALL] Call #${currentCallId}: Attempt ${retryCount} failed, ${maxRetries - retryCount} retries left`);
        
        if (retryCount > maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    const data: PokemonAPIResponse = await response.json();
    console.log(`📥 [FETCH_ALL] Call #${currentCallId}: API returned ${data.results.length} Pokemon`);
    
    // MINIMUM VALIDATION: Ensure we got some data
    if (!data.results || data.results.length === 0) {
      throw new Error('No Pokemon data received from API');
    }
    
    if (data.results.length < 50) {
      console.warn(`⚠️ [FETCH_ALL] Call #${currentCallId}: Only ${data.results.length} Pokemon received - may indicate API issues`);
    }
    
    const filteredList = await processPokemonData(data.results, currentCallId);

    console.log(`✅ [FETCH_ALL] Call #${currentCallId}: Successfully processed ${filteredList.length} Pokemon`);
    return filteredList;
    
  } catch (error) {
    console.error(`❌ [FETCH_ALL] Call #${currentCallId}: fetchAllPokemon failed:`, error);
    throw new Error(`Failed to load Pokemon data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
