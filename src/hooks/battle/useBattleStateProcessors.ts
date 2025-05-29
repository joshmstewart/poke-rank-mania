
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
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] ===== setFinalRankings called =====`);
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] Input type: ${typeof rankings}`);
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] Input is array: ${Array.isArray(rankings)}`);
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] Input length: ${rankings?.length || 'no length property'}`);
    
    if (Array.isArray(rankings) && rankings.length > 0) {
      console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] First 3 Pokemon being set:`, rankings.slice(0, 3).map(p => `${p.name} (${p.id}) - score: ${p.score?.toFixed(1) || 'no score'}`));
    }
    
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] About to call actual setFinalRankings...`);
    
    try {
      stateData.setFinalRankings(rankings);
      console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] ✅ setFinalRankings call completed successfully`);
    } catch (error) {
      console.error(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] ❌ Error in setFinalRankings:`, error);
    }
    
    console.log(`🚨🚨🚨 [SET_FINAL_RANKINGS_MEGA_DEBUG] ===== setFinalRankings call end =====`);
  }, [stateData.setFinalRankings]);

  // CRITICAL FIX: Improved battle result processing with proper async handling
  const processBattleResultWithRefinement = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🔄 [REFINEMENT_PROCESSING_DEBUG] Processing battle with refinement support`);
    
    // Process the battle result
    const result = await milestoneEvents.originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
    
    // CRITICAL FIX: Ensure proper async handling for next battle
    console.log(`🔄 [REFINEMENT_PROCESSING_DEBUG] Battle processed, starting next battle with proper async handling...`);
    
    // Use setTimeout to ensure state updates complete before starting new battle
    setTimeout(async () => {
      try {
        await startNewBattleWrapper();
        console.log(`🔄 [REFINEMENT_PROCESSING_DEBUG] ✅ Next battle started successfully`);
      } catch (error) {
        console.error(`🔄 [REFINEMENT_PROCESSING_DEBUG] ❌ Error starting next battle:`, error);
      }
    }, 50);
    
    return result;
  }, [milestoneEvents.originalProcessBattleResult, startNewBattleWrapper]);

  // Add clearAllSuggestions placeholder
  const clearAllSuggestions = useCallback(() => {
    console.log('🔄 [SUGGESTIONS_DEBUG] Clearing all suggestions');
  }, []);

  return {
    setFinalRankingsWithLogging,
    processBattleResultWithRefinement,
    clearAllSuggestions
  };
};
