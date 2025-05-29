
import { useCallback, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStateEventHandlers = (
  allPokemon: Pokemon[],
  stateData: any,
  startNewBattle: (battleType: BattleType) => Pokemon[],
  milestoneHandlers: any,
  setFinalRankingsWithLogging: (rankings: any) => void
) => {
  // Create a parameterless wrapper for milestone handlers (they expect () => void)
  const startNewBattleWrapper = useCallback(() => {
    console.log(`🚀 [START_NEW_BATTLE_WRAPPER] Parameterless wrapper called`);
    const result = startNewBattle(stateData.battleType);
    if (result && result.length > 0) {
      console.log(`🚀 [START_NEW_BATTLE_WRAPPER] Setting new battle:`, result.map(p => p.name).join(' vs '));
      stateData.setCurrentBattle(result);
      stateData.setSelectedPokemon([]);
    } else {
      console.error(`🚀 [START_NEW_BATTLE_WRAPPER] Failed to create new battle`);
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

  // ADDED: Force initial battle start when component mounts with Pokemon data
  useEffect(() => {
    console.log(`🚀 [INITIAL_BATTLE_DEBUG] Effect triggered - Pokemon: ${allPokemon.length}, currentBattle: ${stateData.currentBattle.length}`);
    
    if (allPokemon.length > 0 && stateData.currentBattle.length === 0) {
      console.log(`🚀 [INITIAL_BATTLE_DEBUG] Starting initial battle...`);
      
      setTimeout(() => {
        const initialBattle = startNewBattle(stateData.battleType);
        if (initialBattle && initialBattle.length > 0) {
          console.log(`✅ [INITIAL_BATTLE_DEBUG] Initial battle created:`, initialBattle.map(p => p.name).join(' vs '));
          stateData.setCurrentBattle(initialBattle);
          stateData.setSelectedPokemon([]);
        } else {
          console.error(`❌ [INITIAL_BATTLE_DEBUG] Failed to create initial battle`);
        }
      }, 100);
    }
  }, [allPokemon.length, stateData.currentBattle.length, startNewBattle, stateData.battleType, stateData.setCurrentBattle, stateData.setSelectedPokemon]);

  return {
    startNewBattleWrapper
  };
};
