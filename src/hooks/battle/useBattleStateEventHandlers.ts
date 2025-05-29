
import { useCallback, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStateEventHandlers = (
  allPokemon: Pokemon[],
  stateData: any,
  startNewBattle: (battleType: BattleType) => Promise<Pokemon[]> | Pokemon[],
  milestoneHandlers: any,
  setFinalRankingsWithLogging: (rankings: any) => void
) => {
  // Create a parameterless wrapper for milestone handlers with proper async handling
  const startNewBattleWrapper = useCallback(async () => {
    console.log(`🚀 [START_NEW_BATTLE_WRAPPER] Parameterless wrapper called`);
    console.log(`🚀 [START_NEW_BATTLE_WRAPPER] Current battle type: ${stateData.battleType}`);
    
    try {
      const result = await startNewBattle(stateData.battleType);
      
      if (result && result.length > 0) {
        console.log(`🚀 [START_NEW_BATTLE_WRAPPER] Setting new battle:`, result.map(p => p.name).join(' vs '));
        stateData.setCurrentBattle(result);
        stateData.setSelectedPokemon([]);
        console.log(`✅ [START_NEW_BATTLE_WRAPPER] New battle set successfully`);
      } else {
        console.error(`🚀 [START_NEW_BATTLE_WRAPPER] Failed to create new battle - empty result`);
        // Fallback: try again after a short delay
        setTimeout(() => {
          startNewBattleWrapper();
        }, 100);
      }
    } catch (error) {
      console.error(`🚀 [START_NEW_BATTLE_WRAPPER] Error creating new battle:`, error);
    }
  }, [startNewBattle, stateData.battleType, stateData.setCurrentBattle, stateData.setSelectedPokemon]);

  // Completion percentage calculation
  useEffect(() => {
    const percentage = milestoneHandlers.calculateCompletionPercentage();
    console.log(`🔧 [COMPLETION_DEBUG] Calculated completion percentage: ${percentage}% for ${stateData.battlesCompleted} battles`);
    stateData.setCompletionPercentage(percentage);
  }, [stateData.battlesCompleted, milestoneHandlers, stateData.setCompletionPercentage]);

  // Event listener for milestone ranking generation
  useEffect(() => {
    const handleGenerateMilestoneRankings = (event: CustomEvent) => {
      console.log(`🔥 [MILESTONE_RANKING_EVENT] Received generate-milestone-rankings event:`, event.detail);
      console.log(`🔥 [MILESTONE_RANKING_EVENT] Current battle history length: ${stateData.battleHistory.length}`);
      console.log(`🔥 [MILESTONE_RANKING_EVENT] Calling milestoneHandlers.generateRankings...`);
      
      try {
        milestoneHandlers.generateRankings();
        console.log(`🔥 [MILESTONE_RANKING_EVENT] ✅ generateRankings called successfully`);
      } catch (error) {
        console.error(`🔥 [MILESTONE_RANKING_EVENT] ❌ Error calling generateRankings:`, error);
      }
    };

    document.addEventListener('generate-milestone-rankings', handleGenerateMilestoneRankings as EventListener);
    
    return () => {
      document.removeEventListener('generate-milestone-rankings', handleGenerateMilestoneRankings as EventListener);
    };
  }, [milestoneHandlers, stateData.battleHistory]);

  // CRITICAL FIX: Force initial battle start with proper async handling
  useEffect(() => {
    console.log(`🚀 [INITIAL_BATTLE_DEBUG] Effect triggered - Pokemon: ${allPokemon.length}, currentBattle: ${stateData.currentBattle.length}`);
    
    if (allPokemon.length > 0 && stateData.currentBattle.length === 0) {
      console.log(`🚀 [INITIAL_BATTLE_DEBUG] Starting initial battle...`);
      
      // Use async wrapper for consistent behavior
      setTimeout(() => {
        startNewBattleWrapper();
      }, 100);
    }
  }, [allPokemon.length, stateData.currentBattle.length, startNewBattleWrapper]);

  return {
    startNewBattleWrapper
  };
};
