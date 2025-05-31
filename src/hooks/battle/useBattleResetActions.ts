
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
    
    // STEP 1: Clear centralized TrueSkill store FIRST
    console.error(`🚨 [BATTLE_RESET_DEBUG] About to call clearAllRatings() from performFullBattleReset`);
    clearAllRatings();
    console.log(`✅ [BATTLE_RESET] Cleared centralized TrueSkill store`);
    
    // STEP 2: Reset all battle state
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
    
    // STEP 3: Clear ALL battle-related localStorage
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
      'suggestionUsageCounts',
      'pokemon-ranker-rankings',
      'pokemon-ranker-confidence'
    ];
    
    // Also clear generation-specific manual rankings
    for (let gen = 0; gen <= 9; gen++) {
      keysToRemove.push(`manual-rankings-gen-${gen}`);
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // STEP 4: Start new battle after a small delay
    setTimeout(() => {
      startNewBattleWrapper();
    }, 100);
    
    // STEP 5: Dispatch events to notify other components
    setTimeout(() => {
      const clearEvent = new CustomEvent('trueskill-store-cleared');
      document.dispatchEvent(clearEvent);
      
      const resetEvent = new CustomEvent('battle-system-reset', {
        detail: { timestamp: Date.now(), source: 'battle-mode-restart' }
      });
      document.dispatchEvent(resetEvent);
    }, 150);
    
    toast.success("Complete battle reset", {
      description: "All battle data and TrueSkill ratings completely cleared. Starting fresh!"
    });
  }, [
    setBattlesCompleted, setBattleResults, setBattleHistory, setSelectedPokemon,
    setMilestoneInProgress, setShowingMilestone, setRankingGenerated,
    setIsBattleTransitioning, setIsAnyProcessing, clearAllSuggestions, 
    clearRefinementQueue, startNewBattleWrapper, clearAllRatings
  ]);

  return { performFullBattleReset };
};
