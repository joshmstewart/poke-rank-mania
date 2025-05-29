
import { useCallback } from "react";
import { toast } from "sonner";

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
  const performFullBattleReset = useCallback(() => {
    console.log(`🔄 [RESET_DEBUG] Performing full battle reset`);
    
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
    clearRefinementQueue, startNewBattleWrapper
  ]);

  return { performFullBattleReset };
};
