
import { useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleHandlers = (
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleType: BattleType,
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  setShowingMilestone: (value: boolean) => void,
  enhancedStartNewBattle: (battleType: BattleType) => Pokemon[] | undefined,
  forceDismissMilestone: () => void,
  resetMilestoneInProgress: () => void,
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>
) => {
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
    enhancedStartNewBattle(battleType);
    console.log("▶️ handleContinueBattles: New battle requested");

    milestoneClosingRef.current = false;
    console.log("✅ handleContinueBattles: Process completed, milestoneClosingRef reset to false");
  }, [battleType, setShowingMilestone, enhancedStartNewBattle]);

  const goBack = useCallback(() => {
    if (battleHistory.length === 0) {
      console.log("No previous battles to go back to");
      return;
    }

    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);

    const newResults = [...battleResults];
    let resultsToRemove = 1;
    if (battleType === "triplets" && lastBattle) {
      const selectedCount = lastBattle.selected.length;
      const unselectedCount = lastBattle.battle.length - selectedCount;
      resultsToRemove = selectedCount * unselectedCount;
    }

    newResults.splice(newResults.length - resultsToRemove, resultsToRemove);
    setBattleResults(newResults);
    setBattlesCompleted(battlesCompleted - 1);

    if (lastBattle) {
      stableSetCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }

    setShowingMilestone(false);
  }, [
    battleHistory,
    setBattleHistory,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleType,
    stableSetCurrentBattle,
    setSelectedPokemon,
    setShowingMilestone
  ]);

  return {
    handleContinueBattles,
    goBack
  };
};
