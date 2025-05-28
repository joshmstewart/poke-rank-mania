
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleInteractions } from "./useBattleInteractions";
import { useBattleActionCoordination } from "./useBattleActionCoordination";
import { useBattleActionProcessing } from "./useBattleActionProcessing";
import { useBattleActionHandlers } from "./useBattleActionHandlers";

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
  const { activeTierAsTopNOption, freezePokemonForTierWrapper } = useBattleActionCoordination(
    activeTier,
    freezePokemonForTierStringWrapper
  );
  
  // Use processing hook for battle result processing
  const {
    processBattleResult,
    isProcessingResult,
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking
  } = useBattleActionProcessing(
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
  } = useBattleActionHandlers(
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
