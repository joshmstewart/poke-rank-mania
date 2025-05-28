
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleStarterCore } from "./useBattleStarterCore";
import { useBattleStateHandlers } from "./useBattleStateHandlers";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStateEffects } from "./useBattleStateEffects";
import { useBattleStateMilestones } from "./useBattleStateMilestones";
import { useBattleStateProcessing } from "./useBattleStateProcessing";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] useBattleStateCore called with ${allPokemon.length} Pokemon`);
  
  // Core state
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [finalRankings, setFinalRankings] = useState<Pokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<{ [pokemonId: number]: number }>({});
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [activeTier, setActiveTier] = useState<TopNOption>("All");
  const [isBattleTransitioning, setIsBattleTransitioning] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [milestones, setMilestones] = useState<number[]>([10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000]);
  const [milestoneInProgress, setMilestoneInProgress] = useState(false);
  const [isAnyProcessing, setIsAnyProcessing] = useState(false);
  const [frozenPokemon, setFrozenPokemon] = useState<number[]>([]);

  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] Hook state initialized, calling battleStarter and refinementQueue hooks`);

  // CRITICAL FIX: Pass a function that returns the current rankings instead of the array directly
  const getCurrentRankings = useCallback(() => finalRankings as RankedPokemon[], [finalRankings]);
  const { startNewBattle } = useBattleStarterCore(allPokemon, getCurrentRankings);
  const refinementQueue = useSharedRefinementQueue();

  // Reset milestones function
  const resetMilestones = useCallback(() => {
    setMilestones([]);
  }, []);

  // Use extracted hooks
  const { processingRef } = useBattleStateEffects(
    allPokemon,
    battleType,
    selectedGeneration,
    frozenPokemon,
    currentBattle,
    selectedPokemon,
    isAnyProcessing,
    isProcessingResult,
    startNewBattle,
    getCurrentRankings,
    setCurrentBattle,
    setSelectedPokemon,
    () => {}, // handleTripletSelectionComplete - will be set up below
    setFinalRankings
  );

  // Battle state handlers with refinement processing placeholder
  const {
    processBattleResultWithRefinement,
    handleManualReorder: actualManualReorder,
    pendingRefinements,
    refinementBattleCount,
    clearRefinementQueue
  } = useBattleStateHandlers(
    allPokemon,
    () => Promise.resolve(), // originalProcessBattleResult placeholder
    finalRankings
  );

  const handlers = useBattleStateHandlers(
    allPokemon,
    currentBattle,
    selectedPokemon,
    battleType,
    selectedGeneration,
    battlesCompleted,
    milestones,
    finalRankings,
    frozenPokemon,
    battleHistory,
    startNewBattle,
    getCurrentRankings,
    refinementQueue,
    setBattleHistory,
    setBattlesCompleted,
    setBattleResults,
    setSelectedPokemon,
    setCurrentBattle,
    setMilestoneInProgress,
    setShowingMilestone,
    setRankingGenerated,
    setIsBattleTransitioning,
    setIsAnyProcessing,
    processBattleResultWithRefinement,
    () => {}, // clearAllSuggestions placeholder
    clearRefinementQueue
  );

  const milestoneHandlers = useBattleStateMilestones(
    finalRankings,
    battleHistory,
    battlesCompleted,
    completionPercentage,
    setShowingMilestone,
    setMilestoneInProgress,
    setRankingGenerated,
    setFinalRankings,
    handlers.startNewBattleWrapper
  );

  const processingHandlers = useBattleStateProcessing(
    selectedPokemon,
    currentBattle,
    battleType,
    selectedGeneration,
    isAnyProcessing,
    isProcessingResult,
    processBattleResultWithRefinement,
    setIsBattleTransitioning,
    setIsAnyProcessing,
    handlers.startNewBattleWrapper
  );

  // Completion percentage effect
  useEffect(() => {
    const percentage = milestoneHandlers.calculateCompletionPercentage();
    setCompletionPercentage(percentage);
  }, [battlesCompleted, milestoneHandlers.calculateCompletionPercentage]);

  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] useBattleStateCore returning state object`);

  return {
    currentBattle,
    battleResults,
    battlesCompleted,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    rankingGenerated,
    selectedPokemon,
    battleType,
    setBattleType,
    finalRankings,
    confidenceScores,
    battleHistory,
    activeTier,
    setActiveTier,
    isBattleTransitioning,
    isAnyProcessing,
    isProcessingResult,
    milestones,
    resetMilestones,
    calculateCompletionPercentage: milestoneHandlers.calculateCompletionPercentage,
    getSnapshotForMilestone: milestoneHandlers.getSnapshotForMilestone,
    handlePokemonSelect: handlers.handlePokemonSelect,
    handleTripletSelectionComplete: processingHandlers.handleTripletSelectionComplete,
    goBack: handlers.goBack,
    generateRankings: milestoneHandlers.generateRankings,
    handleSaveRankings: milestoneHandlers.handleSaveRankings,
    freezePokemonForTier: milestoneHandlers.freezePokemonForTier,
    isPokemonFrozenForTier: milestoneHandlers.isPokemonFrozenForTier,
    suggestRanking: milestoneHandlers.suggestRanking,
    removeSuggestion: milestoneHandlers.removeSuggestion,
    clearAllSuggestions: milestoneHandlers.clearAllSuggestions,
    handleContinueBattles: milestoneHandlers.handleContinueBattles,
    resetMilestoneInProgress: milestoneHandlers.resetMilestoneInProgress,
    performFullBattleReset: handlers.performFullBattleReset,
    handleManualReorder: actualManualReorder,
    pendingRefinements,
    refinementBattleCount,
    clearRefinementQueue,
    startNewBattle: handlers.startNewBattleWrapper
  };
};
