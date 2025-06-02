
import { Pokemon, PokemonAPIResponse } from "../types";
import { trackFetchCall, logFetchParameters } from "./fetchCallTracker";
import { calculateFetchLimit, validatePokemonCount } from "./fetchParameterHandler";
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
    const limit = calculateFetchLimit(initialBatchOnly, batchSize, currentCallId);

    console.log(`🌐 [REFRESH_DETECTION] Call #${currentCallId}: Fetching from API with limit ${limit}`);
    
    const response = await fetch(`${POKEMON_API_BASE}/pokemon?limit=${limit}&offset=0`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PokemonAPIResponse = await response.json();
    console.log(`📥 [REFRESH_DETECTION] Call #${currentCallId}: API returned ${data.results.length} Pokemon`);
    
    validatePokemonCount(data.results.length, currentCallId);
    
    const filteredList = await processPokemonData(data.results, currentCallId);

    return filteredList;
  } catch (error) {
    console.error(`❌ [REFRESH_DETECTION] Call #${currentCallId}: fetchAllPokemon failed:`, error);
    throw error;
  }
};
