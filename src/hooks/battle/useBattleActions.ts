import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

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
    console.log("🟤 useBattleActions: setShowingMilestone(false) triggered (new battle set)");
    setShowingMilestone(false);
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setBattleHistory([]);
    setCompletionPercentage(0);
    startNewBattle(battleType);
  }, [
    battleType,
    setBattleHistory,
    setBattleResults,
    setBattlesCompleted,
    setCompletionPercentage,
    setRankingGenerated,
    setShowingMilestone,
    startNewBattle,
  ]);

  return {
    handleContinueBattles,
    handleNewBattleSet,
    isActioning
  };
};
