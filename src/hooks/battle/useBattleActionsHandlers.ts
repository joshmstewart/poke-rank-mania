
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleActionHandlers } from "./useBattleActionHandlers";

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
  return useBattleActionHandlers(
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
    setIsTransitioning,
    setCompletionPercentage,
    setRankingGenerated,
    resetMilestones,
    resetBattleProgressionMilestoneTracking,
    clearAllSuggestions,
    generateRankings
  );
};
