
import { useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { BattleType } from "./types";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleReset = (
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: any[], selected: number[] }[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  resetMilestones: () => void,
  resetBattleProgressionMilestoneTracking: (() => void) | undefined,
  clearAllSuggestions: () => void,
  generateRankings: (results: any[]) => void,
  enhancedStartNewBattle: (battleType: BattleType) => any[] | undefined
) => {
  const isResettingRef = useRef(false);
  
  // Get clearAllRatings from TrueSkill store
  const { clearAllRatings } = useTrueSkillStore();

  const performFullBattleReset = useCallback(() => {
    console.log('🔄 CENTRALIZED RESET: Beginning full battle reset including TrueSkill store');
    
    if (isResettingRef.current) {
      console.log('🔄 CENTRALIZED RESET: Already resetting, skipping');
      return;
    }
    
    isResettingRef.current = true;
    
    // Reset all state
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setSelectedPokemon([]);
    setCompletionPercentage(0);
    setRankingGenerated(false);
    
    // Reset milestone tracking
    resetMilestones();
    if (resetBattleProgressionMilestoneTracking) {
      resetBattleProgressionMilestoneTracking();
    }
    
    // Clear suggestions
    clearAllSuggestions();
    
    // Clear centralized TrueSkill store
    clearAllRatings();
    console.log('✅ CENTRALIZED RESET: Cleared centralized TrueSkill store');
    
    // Clear localStorage
    const keysToRemove = [
      'pokemon-battle-count',
      'pokemon-battle-results', 
      'pokemon-battle-history',
      'pokemon-active-suggestions',
      'pokemon-battle-tracking',
      'pokemon-battle-seen',
      'suggestionUsageCounts'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Generate empty rankings
    generateRankings([]);
    
    // Start new battle after short delay
    setTimeout(() => {
      enhancedStartNewBattle("pairs");
      isResettingRef.current = false;
      
      toast({
        title: "Battles Restarted",
        description: "All battles have been reset. You're starting fresh!",
        duration: 3000
      });
    }, 100);
  }, [
    setBattlesCompleted,
    setBattleResults,
    setBattleHistory,
    setSelectedPokemon,
    setCompletionPercentage,
    setRankingGenerated,
    resetMilestones,
    resetBattleProgressionMilestoneTracking,
    clearAllSuggestions,
    generateRankings,
    enhancedStartNewBattle,
    clearAllRatings
  ]);

  return {
    performFullBattleReset,
    isResettingRef
  };
};
