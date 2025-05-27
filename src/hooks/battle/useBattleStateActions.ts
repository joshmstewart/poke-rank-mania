
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleActionsManager } from "./useBattleActionsManager";

export const useBattleStateActions = (
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
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  currentBattle: Pokemon[],
  selectedPokemon: number[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>,
  filteredPokemon: Pokemon[],
  milestones: number[],
  generateRankingsWrapper: (results: any[]) => any[],
  activeTier: string,
  freezePokemonForTierStringWrapper: (pokemonId: number, tier: string) => void,
  battleStarter: any,
  markSuggestionUsed: (suggestion: any) => void,
  forceDismissMilestone: () => void,
  resetMilestones: () => void,
  clearAllSuggestions: () => void,
  enhancedStartNewBattle: (battleType: BattleType) => Pokemon[] | undefined
) => {
  // Use the actions manager hook
  const actionsData = useBattleActionsManager(
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
    setCompletionPercentage,
    setRankingGenerated,
    currentBattle,
    selectedPokemon,
    setCurrentBattle,
    setIsTransitioning,
    filteredPokemon,
    milestones,
    generateRankingsWrapper,
    activeTier,
    freezePokemonForTierStringWrapper,
    battleStarter,
    markSuggestionUsed,
    forceDismissMilestone,
    resetMilestones,
    clearAllSuggestions,
    enhancedStartNewBattle
  );

  return actionsData;
};
