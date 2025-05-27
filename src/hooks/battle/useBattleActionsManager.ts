
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleProcessor } from "./useBattleProcessor";
import { useBattleHandlers } from "./useBattleHandlers";
import { useBattleReset } from "./useBattleReset";
import { useBattleInteractions } from "./useBattleInteractions";

export const useBattleActionsManager = (
  // State dependencies
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
  // Coordination dependencies
  filteredPokemon: Pokemon[],
  milestones: number[],
  generateRankings: (results: any[]) => any[], // Fix: Ensure this returns any[]
  activeTier: string,
  freezePokemonForTier: (pokemonId: number, tier: string) => void,
  battleStarter: any,
  markSuggestionUsed: (suggestion: any) => void,
  forceDismissMilestone: () => void,
  resetMilestones: () => void,
  clearAllSuggestions: () => void,
  enhancedStartNewBattle: (battleType: BattleType) => Pokemon[] | undefined
) => {
  
  console.log('[DEBUG useBattleActionsManager] Type check - activeTier:', typeof activeTier, activeTier);
  console.log('[DEBUG useBattleActionsManager] Type check - generateRankings:', typeof generateRankings);
  console.log('[DEBUG useBattleActionsManager] Type check - freezePokemonForTier:', typeof freezePokemonForTier);
  
  const { 
    processBattleResult,
    isProcessingResult, 
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking
  } = useBattleProcessor(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    filteredPokemon,
    stableSetCurrentBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon, // Fix: This should be setSelectedPokemon, not activeTier
    activeTier, // Fix: Move activeTier to correct position
    freezePokemonForTier,
    battleStarter,
    markSuggestionUsed,
    undefined, // isResettingRef will be handled in reset hook
    enhancedStartNewBattle
  );

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
    generateRankings, // This should now match the expected signature
    enhancedStartNewBattle
  );

  const {
    handlePokemonSelect,
    handleGoBack: goBackHelper,
    isProcessing
  } = useBattleInteractions(
    currentBattle,
    stableSetCurrentBattle,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    (battleType: BattleType, currentBattle: Pokemon[]) => {
      if (battleType === "triplets") {
        processBattleResult(selectedPokemon, currentBattle, battleType, 0);
      }
    },
    () => {
      console.log("Going back in battle navigation");
      goBack();
    },
    battleType,
    processBattleResult
  );

  return {
    processBattleResult,
    isProcessingResult,
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking,
    goBack,
    handleContinueBattles,
    performFullBattleReset,
    handlePokemonSelect,
    isProcessing
  };
};
