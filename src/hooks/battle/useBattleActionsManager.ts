
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleActionsCoordination } from "./useBattleActionsCoordination";
import { useBattleActionsProcessing } from "./useBattleActionsProcessing";
import { useBattleActionsHandlers } from "./useBattleActionsHandlers";
import { useBattleActionsInteractions } from "./useBattleActionsInteractions";

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
  
  // Use coordination hook for type conversions
  const { activeTierAsTopNOption, freezePokemonForTierWrapper } = useBattleActionsCoordination(
    activeTier,
    freezePokemonForTierStringWrapper
  );
  
  // Use processing hook for battle result processing
  const {
    processBattleResult,
    isProcessingResult,
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking
  } = useBattleActionsProcessing(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    filteredPokemon,
    stableSetCurrentBattle,
    setShowingMilestone,
    milestones,
    generateRankingsWrapper,
    setSelectedPokemon,
    activeTierAsTopNOption,
    freezePokemonForTierWrapper,
    battleStarter,
    markSuggestionUsed,
    enhancedStartNewBattle
  );

  // Use handlers hook for user actions
  const {
    goBack,
    handleContinueBattles,
    performFullBattleReset
  } = useBattleActionsHandlers(
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
    generateRankingsWrapper
  );

  // Use interactions hook for Pokemon selection handling
  const {
    handlePokemonSelect,
    isProcessing
  } = useBattleActionsInteractions(
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
    battleType,
    processBattleResult,
    goBack
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
