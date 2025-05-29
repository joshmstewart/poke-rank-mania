
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleStarterCore } from "./useBattleStarterCore";
import { useBattleStateHandlers } from "./useBattleStateHandlers";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStateEffects } from "./useBattleStateEffects";
import { useBattleStateMilestones } from "./useBattleStateMilestones";
import { useBattleStateProcessing } from "./useBattleStateProcessing";
import { formatPokemonName } from "@/utils/pokemon";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] useBattleStateCore called with ${allPokemon.length} Pokemon`);
  
  // Core state
  const [currentBattle, setCurrentBattleRaw] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<{ [pokemonId: number]: number }>({});
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [activeTier, setActiveTier] = useState<TopNOption>("All");
  const [isBattleTransitioning, setIsBattleTransitioning] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [milestones, setMilestones] = useState<number[]>([10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000]);
  const [milestoneInProgress, setMilestoneInProgress] = useState(false);
  const [isAnyProcessing, setIsAnyProcessing] = useState(false);
  const [frozenPokemon, setFrozenPokemon] = useState<number[]>([]);

  // CRITICAL FIX: Wrapper for setCurrentBattle that formats Pokemon names
  const setCurrentBattle = useCallback((battle: Pokemon[]) => {
    console.log(`🔧 [NAME_FORMAT_FIX] Formatting names for ${battle.length} Pokemon in current battle`);
    const formattedBattle = battle.map(pokemon => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name)
    }));
    
    formattedBattle.forEach((pokemon, index) => {
      console.log(`🔧 [NAME_FORMAT_FIX] Pokemon #${index + 1}: "${battle[index].name}" → "${pokemon.name}"`);
    });
    
    setCurrentBattleRaw(formattedBattle);
  }, []);

  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] Hook state initialized, calling battleStarter and refinementQueue hooks`);

  // CRITICAL FIX: Pass a function that returns the current rankings instead of the array directly
  const getCurrentRankings = useCallback(() => finalRankings, [finalRankings]);
  const { startNewBattle } = useBattleStarterCore(allPokemon, getCurrentRankings);
  const refinementQueue = useSharedRefinementQueue();

  // Reset milestones function
  const resetMilestones = useCallback(() => {
    setMilestones([]);
  }, []);

  // Original process battle result function
  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🔄 [BATTLE_PROCESSING_ULTRA_DEBUG] Processing battle result`);

    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => [...prev, { battle: currentBattlePokemon, selected }]);

    const newBattlesCompleted = battlesCompleted + 1;
    setBattlesCompleted(newBattlesCompleted);
    localStorage.setItem('pokemon-battle-count', String(newBattlesCompleted));

    const newBattleResult: SingleBattle = {
      battleType,
      generation: selectedGeneration,
      pokemonIds: currentBattlePokemon.map(p => p.id),
      selectedPokemonIds: selectedPokemonIds,
      timestamp: new Date().toISOString()
    };

    setBattleResults(prev => [...prev, newBattleResult]);

    // Check if new battles completed hits a milestone
    const isAtMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_ULTRA_DEBUG] Battle ${newBattlesCompleted} completed. Is milestone? ${isAtMilestone}`);
    
    if (isAtMilestone) {
      console.log(`🏆 [MILESTONE_HIT_ULTRA_DEBUG] Milestone ${newBattlesCompleted} reached!`);
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
    }

    setSelectedPokemon([]);
    return Promise.resolve();
  }, [battlesCompleted, milestones, setBattleHistory, setBattlesCompleted, setBattleResults, setSelectedPokemon, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Add placeholder for processBattleResultWithRefinement
  const processBattleResultWithRefinement = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    return originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
  }, [originalProcessBattleResult]);

  // Add clearAllSuggestions placeholder
  const clearAllSuggestions = useCallback(() => {
    console.log('Clearing all suggestions');
  }, []);

  // Battle state handlers with all required parameters
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
    clearAllSuggestions,
    refinementQueue.clearRefinementQueue
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
    handlers.processBattleResultWithRefinement,
    setIsBattleTransitioning,
    setIsAnyProcessing,
    handlers.startNewBattleWrapper
  );

  // Use extracted effects hook
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
    processingHandlers.handleTripletSelectionComplete,
    setFinalRankings
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
    handleManualReorder: handlers.handleManualReorder,
    pendingRefinements: handlers.pendingRefinements,
    refinementBattleCount: handlers.refinementBattleCount,
    clearRefinementQueue: handlers.clearRefinementQueue,
    startNewBattle: handlers.startNewBattleWrapper
  };
};
