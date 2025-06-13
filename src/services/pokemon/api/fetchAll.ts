import { Pokemon, PokemonAPIResponse } from "../types";
import { trackFetchCall, logFetchParameters } from "./fetchCallTracker";
import { processPokemonData } from "./pokemonProcessor";

const POKEMON_API_BASE = "https://pokeapi.co/api/v2";

export const fetchAllPokemon = async (
  generationId = 0,
  fullRankingMode = true,
  initialBatchOnly = false,
  batchSize = 1500
): Promise<Pokemon[]> => {
  const currentCallId = trackFetchCall();
  logFetchParameters(currentCallId, generationId, fullRankingMode, initialBatchOnly, batchSize);

  try {
    // FULL LOADING RESTORED: Load complete Pokemon dataset for accurate rankings
    const limit = 1500; // Restore full dataset loading instead of progressive batches
    
    console.log(`🌐 [FETCH_ALL] Call #${currentCallId}: Fetching ALL ${limit} Pokemon from API for complete rankings`);
    
    // RETRY LOGIC: Keep the reliable retry mechanism
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
    console.log(`📥 [FETCH_ALL] Call #${currentCallId}: API returned ${data.results.length} Pokemon for complete dataset`);
    
    // VALIDATION: Ensure we got the full dataset
    if (!data.results || data.results.length === 0) {
      throw new Error('No Pokemon data received from API');
    }
    
    // DEBUG INFO: Log dataset completeness
    console.log(`📊 [DATASET_DEBUG] Total Pokemon fetched: ${data.results.length} of expected ~1500`);
    if (data.results.length < 1000) {
      console.warn(`⚠️ [FETCH_ALL] Call #${currentCallId}: Only ${data.results.length} Pokemon received - incomplete dataset may affect rankings`);
    }
    
    const filteredList = await processPokemonData(data.results, currentCallId);

    console.log(`✅ [FETCH_ALL] Call #${currentCallId}: Successfully processed ${filteredList.length} Pokemon from complete dataset`);
    console.log(`📊 [DATASET_COMPLETE] Full Pokemon dataset loaded for accurate rankings`);
    
    return filteredList;
    
  } catch (error) {
    console.error(`❌ [FETCH_ALL] Call #${currentCallId}: fetchAllPokemon failed:`, error);
    throw new Error(`Failed to load complete Pokemon dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
