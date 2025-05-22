
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
    if (milestoneClosingRef.current) return;
    milestoneClosingRef.current = true;

    console.log("🟤 useBattleActions: setShowingMilestone(false) triggered (continue battles)");
    setShowingMilestone(false);
    startNewBattle(battleType);

    milestoneClosingRef.current = false;
  }, [battleType, setShowingMilestone, startNewBattle]);

  const handleNewBattleSet = useCallback(() => {
    console.log("🚨 RESTART: handleNewBattleSet triggered - FULL RESTART");
    console.log("🚨 RESTART: Current state before reset:", {
      battleType,
      rankingGeneratedExists: typeof setRankingGenerated === 'function',
      battlesCompletedExists: typeof setBattlesCompleted === 'function',
      battleHistoryExists: typeof setBattleHistory === 'function',
    });
    
    console.log("🟤 useBattleActions: setShowingMilestone(false) triggered (new battle set)");
    setShowingMilestone(false);
    
    // Reset all battle results
    console.log("🚨 RESTART: Clearing battle results");
    setBattleResults([]);
    
    // Critical: Reset battles completed to 0 
    console.log("🚨 RESTART: Setting battlesCompleted explicitly to 0");
    setBattlesCompleted(0);
    
    // Reset ranking flag
    console.log("🚨 RESTART: Setting rankingGenerated explicitly to FALSE");
    setRankingGenerated(false);
    console.log("🟢 setRankingGenerated explicitly set to FALSE.");

    // Reset battle history
    console.log("🚨 RESTART: Clearing battle history array");
    setBattleHistory([]);
    console.log("🔄 setBattleHistory explicitly reset to empty array.");

    // Reset completion percentage
    console.log("🚨 RESTART: Setting completionPercentage to 0");
    setCompletionPercentage(0);

    // ✅ Regenerate rankings explicitly after clearing suggestions
    console.log("🚨 RESTART: Generating empty rankings");
    generateRankings([]);
    console.log("✅ Rankings regenerated explicitly after restart with empty suggestions");

    // ✅ Reset all battle-related localStorage items for complete reset
    console.log("🚨 RESTART: Clearing all localStorage keys");
    const keysToRemove = [
      'pokemon-battle-recently-used', 
      'pokemon-battle-last-battle',
      'pokemon-ranker-battle-history',
      'pokemon-battle-history',
      'pokemon-active-suggestions',
      'pokemon-battle-tracking',
      'pokemon-battle-seen',
      'suggestionUsageCounts'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Cleared localStorage key: ${key}`);
    });

    // Dispatch custom event to notify components that we've done a complete reset
    console.log("🚨 RESTART: Dispatching force-emergency-reset event");
    const event = new CustomEvent('force-emergency-reset', {
      detail: { source: 'restart-button' }
    });
    document.dispatchEvent(event);
    
    // Start a new battle with the current battle type
    console.log("🚨 RESTART: Calling startNewBattle with battleType:", battleType);
    startNewBattle(battleType);
    
    toast({
      title: "Battles Restarted",
      description: "All battles, rankings, and suggestions have been reset.",
      duration: 3000
    });
    
    console.log("🚨 RESTART: handleNewBattleSet completed");
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
