// CRITICAL: Add logging for refresh detection
let lastFetchCallCount = 0;
let fetchCallTimestamps: string[] = [];

export const trackFetchCall = () => {
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
  
  return currentCallId;
};

export const logFetchParameters = (
  callId: number,
  generationId: number,
  fullRankingMode: boolean,
  initialBatchOnly: boolean,
  batchSize: number
) => {
  const timestamp = new Date().toISOString();
  console.log(`🔍 [REFRESH_DETECTION] fetchAllPokemon parameters:`, {
    callId,
    generationId,
    fullRankingMode,
    initialBatchOnly,
    batchSize,
    timestamp
  });
};
