
import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleCompletionTracking } from "./useBattleCompletionTracking";
import { useBattleSelection } from "./useBattleSelection";
import { useBattleNavigation } from "./useBattleNavigation";
import { useBattleResetActions } from "./useBattleResetActions";
import { useBattleManualReorder } from "./useBattleManualReorder";
import { useBattlePendingState } from "./useBattlePendingState";

export const useBattleStateHandlers = (
  allPokemon: Pokemon[],
  currentBattle: Pokemon[],
  selectedPokemon: number[],
  battleType: BattleType,
  selectedGeneration: number,
  battlesCompleted: number,
  milestones: number[],
  finalRankings: RankedPokemon[],
  frozenPokemon: number[],
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  startNewBattle: (battleType: BattleType) => Pokemon[],
  getCurrentRankings: () => RankedPokemon[],
  refinementQueue: any,
  setBattleHistory: any,
  setBattlesCompleted: any,
  setBattleResults: any,
  setSelectedPokemon: any,
  setCurrentBattle: any,
  setMilestoneInProgress: any,
  setShowingMilestone: any,
  setRankingGenerated: any,
  setIsBattleTransitioning: any,
  setIsAnyProcessing: any,
  processBattleResultWithRefinement: any,
  clearAllSuggestions: any,
  clearRefinementQueue: any,
  generateRankings: any
) => {
  console.log(`🔧 [HANDLERS_DEBUG] useBattleStateHandlers called`);

  const { handleBattleCompleted } = useBattleCompletionTracking();

  const { handlePokemonSelect } = useBattleSelection(
    selectedPokemon,
    setSelectedPokemon,
    battleType,
    currentBattle,
    selectedGeneration,
    processBattleResultWithRefinement,
    handleBattleCompleted
  );

  const { goBack, startNewBattleWrapper } = useBattleNavigation(
    battleHistory,
    setBattleHistory,
    setCurrentBattle,
    setSelectedPokemon,
    setBattlesCompleted,
    startNewBattle
  );

  const { performFullBattleReset } = useBattleResetActions(
    setBattlesCompleted,
    setBattleResults,
    setBattleHistory,
    setSelectedPokemon,
    setMilestoneInProgress,
    setShowingMilestone,
    setRankingGenerated,
    setIsBattleTransitioning,
    setIsAnyProcessing,
    clearAllSuggestions,
    clearRefinementQueue,
    () => startNewBattleWrapper(battleType)
  );

  const { handleManualReorder } = useBattleManualReorder(
    finalRankings,
    refinementQueue
  );

  const { pendingRefinements, refinementBattleCount } = useBattlePendingState(
    refinementQueue
  );

  return {
    handlePokemonSelect,
    goBack,
    startNewBattleWrapper,
    performFullBattleReset,
    handleManualReorder,
    pendingRefinements,
    refinementBattleCount,
    clearRefinementQueue
  };
};
