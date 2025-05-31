
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
    console.log(`🔄 [BATTLE_RESET] Performing COMPLETE battle reset including centralized TrueSkill store`);
    console.error(`🚨 [BATTLE_RESET_DEBUG] performFullBattleReset called - this will clear ALL data!`);
    console.error(`🚨 [BATTLE_RESET_DEBUG] Stack trace:`, new Error().stack);
    
    // Reset all battle state
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
    console.error(`🚨 [BATTLE_RESET_DEBUG] About to call clearAllRatings() from performFullBattleReset`);
    clearAllRatings();
    console.log(`✅ [BATTLE_RESET] Cleared centralized TrueSkill store`);
    
    // Clear ALL battle-related localStorage
    const keysToRemove = [
      'pokemon-battle-count',
      'pokemon-battle-results',
      'pokemon-battle-history',
      'pokemon-battle-recently-used',
      'pokemon-battle-last-battle',
      'pokemon-ranker-battle-history',
      'pokemon-battle-tracking',
      'pokemon-battle-seen',
      'pokemon-active-suggestions',
      'suggestionUsageCounts'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setTimeout(() => {
      startNewBattleWrapper();
    }, 100);
    
    toast.success("Complete battle reset", {
      description: "All battle data and rankings cleared. Starting fresh!"
    });
  }, [
    setBattlesCompleted, setBattleResults, setBattleHistory, setSelectedPokemon,
    setMilestoneInProgress, setShowingMilestone, setRankingGenerated,
    setIsBattleTransitioning, setIsAnyProcessing, clearAllSuggestions, 
    clearRefinementQueue, startNewBattleWrapper, clearAllRatings
  ]);

  return { performFullBattleReset };
};
