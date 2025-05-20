import { useCallback } from "react";
import { SingleBattle } from "./types";
import { useBattleProgression } from "./useBattleProgression";

export const useBattleProcessor = (
  battleResults: SingleBattle[],
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: SingleBattle[]) => void
) => {

  const { incrementBattlesCompleted } = useBattleProgression(
    battleResults.length,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );

  const processBattleResult = useCallback((newResults: SingleBattle[]) => {
    console.log("🟡 useBattleProcessor: incremented battles completed");
    incrementBattlesCompleted(newResults);
  }, [incrementBattlesCompleted]);

  return {
    processBattleResult,
  };
};
