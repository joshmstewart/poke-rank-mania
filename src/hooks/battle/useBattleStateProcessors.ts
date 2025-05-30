
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStateProcessors = (
  stateData: any,
  milestoneEvents: any,
  startNewBattleWrapper: () => Promise<void> | void
) => {
  // Enhanced setFinalRankings wrapper with detailed logging
  const setFinalRankingsWithLogging = useCallback((rankings: any) => {
    console.log(`[CENTRALIZED_RANKINGS] Setting final rankings from centralized TrueSkill store`);
    console.log(`[CENTRALIZED_RANKINGS] Input type: ${typeof rankings}`);
    console.log(`[CENTRALIZED_RANKINGS] Input is array: ${Array.isArray(rankings)}`);
    console.log(`[CENTRALIZED_RANKINGS] Input length: ${rankings?.length || 'no length property'}`);
    
    if (Array.isArray(rankings) && rankings.length > 0) {
      console.log(`[CENTRALIZED_RANKINGS] First 3 Pokemon being set:`, rankings.slice(0, 3).map(p => `${p.name} (${p.id}) - score: ${p.score?.toFixed(1) || 'no score'}`));
    }
    
    try {
      stateData.setFinalRankings(rankings);
      console.log(`[CENTRALIZED_RANKINGS] ✅ Rankings set successfully from centralized store`);
    } catch (error) {
      console.error(`[CENTRALIZED_RANKINGS] ❌ Error setting rankings:`, error);
    }
  }, [stateData.setFinalRankings]);

  // Improved battle result processing with centralized store integration
  const processBattleResultWithRefinement = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`[CENTRALIZED_PROCESSING] Processing battle with centralized TrueSkill store`);
    
    // Process the battle result - ratings will be handled by centralized store
    const result = await milestoneEvents.originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
    
    console.log(`[CENTRALIZED_PROCESSING] Battle processed, all ratings stored in centralized store`);
    
    // Start next battle with proper async handling
    setTimeout(async () => {
      try {
        await startNewBattleWrapper();
        console.log(`[CENTRALIZED_PROCESSING] ✅ Next battle started successfully`);
      } catch (error) {
        console.error(`[CENTRALIZED_PROCESSING] ❌ Error starting next battle:`, error);
      }
    }, 50);
    
    return result;
  }, [milestoneEvents.originalProcessBattleResult, startNewBattleWrapper]);

  // Placeholder for suggestions management
  const clearAllSuggestions = useCallback(() => {
    console.log('[CENTRALIZED_SUGGESTIONS] Clearing all suggestions');
  }, []);

  return {
    setFinalRankingsWithLogging,
    processBattleResultWithRefinement,
    clearAllSuggestions
  };
};
