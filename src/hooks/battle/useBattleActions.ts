
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { toast } from "@/hooks/use-toast";

export const useBattleActions = (
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setShowingMilestone: (value: boolean) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  startNewBattle: (battleType: BattleType) => void,
  generateRankings: (results: SingleBattle[]) => void,
  battleType: BattleType
) => {
  const [isActioning, setIsActioning] = useState(false);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const milestoneClosingRef = useRef(false);

  const handleContinueBattles = useCallback(() => {
    if (milestoneClosingRef.current) {
      console.log("⚠️ handleContinueBattles: Already processing milestone closure, ignoring");
      return;
    }
    milestoneClosingRef.current = true;
    console.log("▶️ handleContinueBattles: Starting milestone closure process");

    console.log("▶️ handleContinueBattles: Setting showingMilestone = false");
    setShowingMilestone(false);
    
    console.log("▶️ handleContinueBattles: Starting new battle with battleType =", battleType);
    startNewBattle(battleType);
    console.log("▶️ handleContinueBattles: New battle requested");

    milestoneClosingRef.current = false;
    console.log("✅ handleContinueBattles: Process completed, milestoneClosingRef reset to false");
  }, [battleType, setShowingMilestone, startNewBattle]);

  const handleNewBattleSet = useCallback(() => {
    console.log("🔄 RESTART: handleNewBattleSet triggered - FULL RESTART");
    console.log("🔄 RESTART: Current battle type =", battleType);
    
    // DEBUG: Check function references
    console.log("🔄 RESTART: Function references check:");
    console.log("  - setRankingGenerated:", typeof setRankingGenerated === 'function' ? "Valid function" : "NOT A FUNCTION");
    console.log("  - setBattlesCompleted:", typeof setBattlesCompleted === 'function' ? "Valid function" : "NOT A FUNCTION");
    console.log("  - setBattleHistory:", typeof setBattleHistory === 'function' ? "Valid function" : "NOT A FUNCTION");
    
    console.log("🔄 RESTART: Setting showingMilestone = false");
    setShowingMilestone(false);
    
    // Reset all battle results
    console.log("🔄 RESTART: Clearing battle results");
    setBattleResults([]);
    
    // CRITICAL: Reset battles completed explicitly to 0 
    console.log("🔄 RESTART: Setting battlesCompleted explicitly to 0");
    setBattlesCompleted(0);
    console.log("🔄 RESTART: ✅ battlesCompleted explicitly reset to 0");
    
    // Reset ranking flag
    console.log("🔄 RESTART: Setting rankingGenerated explicitly to FALSE");
    setRankingGenerated(false);

    // Reset battle history
    console.log("🔄 RESTART: Clearing battle history array");
    setBattleHistory([]);

    // Reset completion percentage
    console.log("🔄 RESTART: Setting completionPercentage to 0");
    setCompletionPercentage(0);

    // Regenerate rankings explicitly after clearing suggestions
    console.log("🔄 RESTART: Generating empty rankings");
    generateRankings([]);
    
    // Clear all battle-related localStorage items for complete reset
    console.log("🔄 RESTART: Clearing all localStorage keys");
    const keysToRemove = [
      'pokemon-battle-recently-used', 
      'pokemon-battle-last-battle',
      'pokemon-ranker-battle-history',
      'pokemon-battle-history',
      'pokemon-active-suggestions',
      'pokemon-battle-tracking',
      'pokemon-battle-seen',
      'suggestionUsageCounts',
      'pokemon-battle-count'
    ];
    
    keysToRemove.forEach(key => {
      const beforeValue = localStorage.getItem(key);
      localStorage.removeItem(key);
      console.log(`🔄 RESTART: Cleared localStorage key "${key}": was ${beforeValue ? `"${beforeValue}"` : "empty"}`);
    });

    // Dispatch custom event to notify components that we've done a complete reset
    console.log("🔄 RESTART: Creating force-emergency-reset event");
    const event = new CustomEvent('force-emergency-reset', {
      detail: { 
        source: 'restart-button', 
        fullReset: true,
        timestamp: new Date().toISOString() 
      }
    });
    
    console.log("🔄 RESTART: Dispatching force-emergency-reset event");
    document.dispatchEvent(event);
    console.log("🔄 RESTART: Event dispatched");
    
    // Short delay before starting a new battle to ensure reset is processed
    console.log("🔄 RESTART: Starting 100ms timeout before starting new battle");
    setTimeout(() => {
      // Double-check that battlesCompleted is still 0 before proceeding
      console.log("🔄 RESTART: Timeout completed, verifying battlesCompleted is 0 before starting new battle");
      
      // Start a new battle with the current battle type
      console.log("🔄 RESTART: Calling startNewBattle with battleType:", battleType);
      startNewBattle(battleType);
      
      toast({
        title: "Battles Restarted",
        description: "All battles, rankings, and suggestions have been reset.",
        duration: 3000
      });
      
      console.log("✅ RESTART: handleNewBattleSet completed");
    }, 100);
    
  }, [
    battleType,
    setBattleHistory,
    setBattleResults,
    setBattlesCompleted,
    setCompletionPercentage,
    setRankingGenerated,
    setShowingMilestone,
    startNewBattle,
    generateRankings,
  ]);

  return {
    handleContinueBattles,
    handleNewBattleSet,
    isActioning
  };
};
