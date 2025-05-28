
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

  // Battle state handlers
  const handlers = useBattleStateHandlers(
    allPokemon,
    originalProcessBattleResult,
    finalRankings
  );

  // Override handlers with actual implementations
  const enhancedHandlers = {
    ...handlers,
    handlePokemonSelect: useCallback((id: number) => {
      console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pokemon ${id} selected. Current selections:`, selectedPokemon);
      
      setSelectedPokemon(prev => {
        if (prev.includes(id)) {
          console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Deselecting Pokemon ${id}`);
          return prev.filter(pokemonId => pokemonId !== id);
        } else {
          const newSelection = [...prev, id];
          console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Adding Pokemon ${id}. New selection:`, newSelection);
          return newSelection;
        }
      });
    }, [selectedPokemon]),

    startNewBattleWrapper: useCallback(() => {
      console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] Starting new battle`);
      
      if (!startNewBattle) {
        console.error(`❌ [START_NEW_BATTLE_ULTRA_DEBUG] startNewBattle not available`);
        return;
      }
      
      const config = {
        allPokemon,
        currentRankings: getCurrentRankings(),
        battleType,
        selectedGeneration,
        freezeList: frozenPokemon
      };
      const newBattle = startNewBattle(config);
      
      if (newBattle && newBattle.length > 0) {
        setCurrentBattle(newBattle);
        setSelectedPokemon([]);
        console.log(`✅ [START_NEW_BATTLE_ULTRA_DEBUG] New battle set successfully`);
      }
    }, [battleType, startNewBattle, allPokemon, getCurrentRankings, selectedGeneration, frozenPokemon]),

    goBack: useCallback(() => {
      if (battleHistory.length > 0) {
        const lastBattle = battleHistory[battleHistory.length - 1];
        setCurrentBattle(lastBattle.battle);
        setSelectedPokemon(lastBattle.selected);
        setBattleHistory(prev => prev.slice(0, -1));
        setBattlesCompleted(prev => prev - 1);
        setBattleResults(prev => prev.slice(0, -1));
      }
    }, [battleHistory]),

    performFullBattleReset: useCallback(() => {
      localStorage.removeItem('pokemon-battle-count');
      setBattlesCompleted(0);
      setBattleResults([]);
      setBattleHistory([]);
      setRankingGenerated(false);
      setShowingMilestone(false);
      setMilestoneInProgress(false);
      refinementQueue.clearRefinementQueue();
    }, [refinementQueue]),

    pendingRefinements: refinementQueue.refinementQueue ? new Set(refinementQueue.refinementQueue.map(r => r.primaryPokemonId)) : new Set<number>(),
    refinementBattleCount: refinementQueue.refinementBattleCount || 0,
    clearRefinementQueue: refinementQueue.clearRefinementQueue
  };

  const milestoneHandlers = useBattleStateMilestones(
    finalRankings,
    battleHistory,
    battlesCompleted,
    completionPercentage,
    setShowingMilestone,
    setMilestoneInProgress,
    setRankingGenerated,
    setFinalRankings,
    enhancedHandlers.startNewBattleWrapper
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
    enhancedHandlers.startNewBattleWrapper
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
    handlePokemonSelect: enhancedHandlers.handlePokemonSelect,
    handleTripletSelectionComplete: processingHandlers.handleTripletSelectionComplete,
    goBack: enhancedHandlers.goBack,
    generateRankings: milestoneHandlers.generateRankings,
    handleSaveRankings: milestoneHandlers.handleSaveRankings,
    freezePokemonForTier: milestoneHandlers.freezePokemonForTier,
    isPokemonFrozenForTier: milestoneHandlers.isPokemonFrozenForTier,
    suggestRanking: milestoneHandlers.suggestRanking,
    removeSuggestion: milestoneHandlers.removeSuggestion,
    clearAllSuggestions: milestoneHandlers.clearAllSuggestions,
    handleContinueBattles: milestoneHandlers.handleContinueBattles,
    resetMilestoneInProgress: milestoneHandlers.resetMilestoneInProgress,
    performFullBattleReset: enhancedHandlers.performFullBattleReset,
    handleManualReorder: enhancedHandlers.handleManualReorder,
    pendingRefinements: enhancedHandlers.pendingRefinements,
    refinementBattleCount: enhancedHandlers.refinementBattleCount,
    clearRefinementQueue: enhancedHandlers.clearRefinementQueue,
    startNewBattle: enhancedHandlers.startNewBattleWrapper
  };
};
