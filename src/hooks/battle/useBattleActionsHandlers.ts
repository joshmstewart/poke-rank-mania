
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleHandlers } from "./useBattleHandlers";
import { useBattleReset } from "./useBattleReset";

export const useBattleActionsHandlers = (
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleType: BattleType,
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  setShowingMilestone: (show: boolean) => void,
  enhancedStartNewBattle: (battleType: BattleType) => Pokemon[] | undefined,
  forceDismissMilestone: () => void,
  resetMilestoneInProgress: () => void,
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  resetMilestones: () => void,
  resetBattleProgressionMilestoneTracking: () => void,
  clearAllSuggestions: () => void,
  generateRankings: (results: any[]) => any[]
) => {
  // Use the extracted battle handlers hook
  const { goBack, handleContinueBattles } = useBattleHandlers(
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

  // Use the extracted reset hook
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

  return {
    goBack,
    handleContinueBattles,
    performFullBattleReset
  };
};
