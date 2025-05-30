
import { useCallback } from "react";
import { toast } from "sonner";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleResetActions = (
  setBattlesCompleted: any,
  setBattleResults: any,
  setBattleHistory: any,
  setSelectedPokemon: any,
  setMilestoneInProgress: any,
  setShowingMilestone: any,
  setRankingGenerated: any,
  setIsBattleTransitioning: any,
  setIsAnyProcessing: any,
  clearAllSuggestions: any,
  clearRefinementQueue: any,
  startNewBattleWrapper: () => any
) => {
  // Get clearAllRatings from TrueSkill store
  const { clearAllRatings } = useTrueSkillStore();

  const performFullBattleReset = useCallback(() => {
    console.log(`🔄 [BATTLE_RESET] Performing full battle reset including centralized TrueSkill store`);
    
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setSelectedPokemon([]);
    setMilestoneInProgress(false);
    setShowingMilestone(false);
    setRankingGenerated(false);
    setIsBattleTransitioning(false);
    setIsAnyProcessing(false);
    
    clearAllSuggestions();
    clearRefinementQueue();
    
    // Clear centralized TrueSkill store
    clearAllRatings();
    console.log(`✅ [BATTLE_RESET] Cleared centralized TrueSkill store`);
    
    localStorage.removeItem('pokemon-battle-count');
    localStorage.removeItem('pokemon-battle-results');
    
    setTimeout(() => {
      startNewBattleWrapper();
    }, 100);
    
    toast.success("Battle progress reset", {
      description: "Starting fresh with a new battle"
    });
  }, [
    setBattlesCompleted, setBattleResults, setBattleHistory, setSelectedPokemon,
    setMilestoneInProgress, setShowingMilestone, setRankingGenerated,
    setIsBattleTransitioning, setIsAnyProcessing, clearAllSuggestions, 
    clearRefinementQueue, startNewBattleWrapper, clearAllRatings
  ]);

  return { performFullBattleReset };
};
