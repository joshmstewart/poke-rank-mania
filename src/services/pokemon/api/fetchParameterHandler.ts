
export const calculateFetchLimit = (
  initialBatchOnly: boolean,
  batchSize: number,
  callId: number
): number => {
  // FIXED: Always fetch ALL Pokemon (1025+ is the minimum)
  let limit = 2000; // Increased to ensure we get all Pokemon including variants
  
  // CRITICAL: Log different batch modes
  if (initialBatchOnly) {
    limit = batchSize;
    console.log(`📦 [REFRESH_DETECTION] Call #${callId}: INITIAL BATCH MODE - limit: ${limit}`);
  } else {
    console.log(`📦 [REFRESH_DETECTION] Call #${callId}: FULL LOAD MODE - limit: ${limit} (FIXED TO GET ALL POKEMON)`);
  }

  return limit;
};

export const validatePokemonCount = (count: number, callId: number): void => {
  // CRITICAL: Verify we got enough Pokemon
  if (count < 1025) {
    console.error(`🚨 [POKEMON_COUNT_ERROR] Call #${callId}: Only got ${count} Pokemon, expected at least 1025!`);
  }
};
