
import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleHandlers } from "./useBattleHandlers";
import { useBattleReset } from "./useBattleReset";

export const useBattleActions = (
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleType: BattleType,
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  setShowingMilestone: (value: boolean) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  enhancedStartNewBattle: (battleType: BattleType) => Pokemon[] | undefined,
  generateRankings: (results: SingleBattle[]) => void,
  resetMilestones: () => void,
  resetBattleProgressionMilestoneTracking: (() => void) | undefined,
  clearAllSuggestions: () => void,
  forceDismissMilestone: () => void,
  resetMilestoneInProgress: () => void,
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isActioning, setIsActioning] = useState(false);

  // Use the battle handlers hook
  const { handleContinueBattles, goBack } = useBattleHandlers(
    battleHistory,
    setBattleHistory,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleType,
    stableSetCurrentBattle,
    setSelectedPokemon,
    setShowingMilestone,
    enhancedStartNewBattle,
    forceDismissMilestone,
    resetMilestoneInProgress,
    setCurrentBattle,
    setIsTransitioning
  );

  // Use the reset hook
  const { performFullBattleReset } = useBattleReset(
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
    enhancedStartNewBattle
  );

  const handleNewBattleSet = useCallback(() => {
    console.log("🔄 RESTART: handleNewBattleSet triggered - using centralized reset");
    performFullBattleReset();
  }, [performFullBattleReset]);

  return {
    handleContinueBattles,
    handleNewBattleSet,
    goBack,
    performFullBattleReset,
    isActioning
  };
};
