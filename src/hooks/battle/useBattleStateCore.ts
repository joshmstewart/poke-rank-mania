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
  
  // CRITICAL FIX: All state hooks must be called unconditionally and in the same order every time
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

  // CRITICAL FIX: All useEffect hooks must be called unconditionally and in the same order
  useEffect(() => {
    console.log(`🔧 [STATE_CHANGE_ULTRA_DEBUG] battlesCompleted changed to: ${battlesCompleted}`);
    console.log(`🔧 [STATE_CHANGE_ULTRA_DEBUG] Available milestones: ${milestones.join(', ')}`);
    console.log(`🔧 [STATE_CHANGE_ULTRA_DEBUG] Is ${battlesCompleted} in milestones? ${milestones.includes(battlesCompleted)}`);
  }, [battlesCompleted, milestones]);

  useEffect(() => {
    console.log(`🔧 [STATE_CHANGE_ULTRA_DEBUG] showingMilestone changed to: ${showingMilestone}`);
  }, [showingMilestone]);

  useEffect(() => {
    console.log(`🔧 [STATE_CHANGE_ULTRA_DEBUG] rankingGenerated changed to: ${rankingGenerated}`);
  }, [rankingGenerated]);

  useEffect(() => {
    console.log(`🔧 [STATE_CHANGE_ULTRA_DEBUG] finalRankings changed - length: ${finalRankings.length}`);
    if (finalRankings.length > 0) {
      console.log(`🔧 [STATE_CHANGE_ULTRA_DEBUG] Top 3 rankings:`, finalRankings.slice(0, 3).map(p => `${p.name} (${p.id})`));
    }
  }, [finalRankings]);

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

  // CRITICAL FIX: getCurrentRankings must be defined before other hooks that use it
  const getCurrentRankings = useCallback(() => {
    console.log(`🔧 [RANKINGS_DEBUG] getCurrentRankings called - finalRankings length: ${finalRankings.length}`);
    console.log(`🔧 [RANKINGS_DEBUG] Sample rankings:`, finalRankings.slice(0, 3).map(p => `${p.name} (${p.id})`));
    return finalRankings;
  }, [finalRankings]);
  
  // CRITICAL FIX: All custom hooks must be called unconditionally and in the same order every time
  const { startNewBattle } = useBattleStarterCore(allPokemon, getCurrentRankings);
  const refinementQueue = useSharedRefinementQueue();

  // Reset milestones function
  const resetMilestones = useCallback(() => {
    console.log(`🔧 [MILESTONE_DEBUG] Resetting milestones`);
    setMilestones([]);
  }, []);

  // ENHANCED: Original process battle result function with ULTRA EXTENSIVE logging
  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] ===== PROCESSING BATTLE RESULT START =====`);
    console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] Input data:`);
    console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] - selectedPokemonIds:`, selectedPokemonIds);
    console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] - currentBattlePokemon:`, currentBattlePokemon.map(p => `${p.name} (${p.id})`));
    console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] - battleType: ${battleType}`);
    console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] - CURRENT battles completed BEFORE increment: ${battlesCompleted}`);

    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => {
      const newHistory = [...prev, { battle: currentBattlePokemon, selected }];
      console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] Updated battle history length: ${newHistory.length}`);
      return newHistory;
    });

    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] NEW battles completed AFTER increment: ${newBattlesCompleted}`);
    console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] Available milestones for checking: ${milestones.join(', ')}`);
    
    setBattlesCompleted(newBattlesCompleted);
    localStorage.setItem('pokemon-battle-count', String(newBattlesCompleted));

    const newBattleResult: SingleBattle = {
      battleType,
      generation: selectedGeneration,
      pokemonIds: currentBattlePokemon.map(p => p.id),
      selectedPokemonIds: selectedPokemonIds,
      timestamp: new Date().toISOString()
    };

    setBattleResults(prev => {
      const newResults = [...prev, newBattleResult];
      console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] Updated battle results length: ${newResults.length}`);
      console.log(`🔄 [BATTLE_PROCESSING_MEGA_DEBUG] Latest battle result:`, newBattleResult);
      return newResults;
    });

    // ENHANCED: Ultra-detailed milestone checking
    const isAtMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_MEGA_DEBUG] ===== MILESTONE CHECK START =====`);
    console.log(`🎯 [MILESTONE_CHECK_MEGA_DEBUG] Battle ${newBattlesCompleted} completed`);
    console.log(`🎯 [MILESTONE_CHECK_MEGA_DEBUG] Available milestones array:`, milestones);
    console.log(`🎯 [MILESTONE_CHECK_MEGA_DEBUG] Checking if ${newBattlesCompleted} is in milestones array...`);
    console.log(`🎯 [MILESTONE_CHECK_MEGA_DEBUG] milestones.includes(${newBattlesCompleted}) = ${isAtMilestone}`);
    
    if (isAtMilestone) {
      console.log(`🏆 [MILESTONE_HIT_MEGA_DEBUG] ===== MILESTONE ${newBattlesCompleted} REACHED! =====`);
      console.log(`🏆 [MILESTONE_HIT_MEGA_DEBUG] About to set milestone flags...`);
      console.log(`🏆 [MILESTONE_HIT_MEGA_DEBUG] BEFORE: milestoneInProgress=${milestoneInProgress}, showingMilestone=${showingMilestone}, rankingGenerated=${rankingGenerated}`);
      
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
      
      console.log(`🏆 [MILESTONE_HIT_MEGA_DEBUG] AFTER setting flags - these should be true in the next render`);
      console.log(`🏆 [MILESTONE_HIT_MEGA_DEBUG] Current finalRankings length: ${finalRankings.length}`);
      
      // Add a timeout to check if the states actually changed
      setTimeout(() => {
        console.log(`🏆 [MILESTONE_DELAYED_CHECK] Checking milestone states after 100ms:`);
        console.log(`🏆 [MILESTONE_DELAYED_CHECK] - milestoneInProgress should be true`);
        console.log(`🏆 [MILESTONE_DELAYED_CHECK] - showingMilestone should be true`);
        console.log(`🏆 [MILESTONE_DELAYED_CHECK] - rankingGenerated should be true`);
      }, 100);
      
    } else {
      console.log(`🎯 [MILESTONE_CHECK_MEGA_DEBUG] No milestone hit for battle ${newBattlesCompleted}`);
    }
    
    console.log(`🎯 [MILESTONE_CHECK_MEGA_DEBUG] ===== MILESTONE CHECK END =====`);

    setSelectedPokemon([]);
    console.log(`✅ [BATTLE_PROCESSING_MEGA_DEBUG] ===== PROCESSING BATTLE RESULT END =====`);
    return Promise.resolve();
  }, [battlesCompleted, milestones, finalRankings, milestoneInProgress, showingMilestone, rankingGenerated, setBattleHistory, setBattlesCompleted, setBattleResults, setSelectedPokemon, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Add placeholder for processBattleResultWithRefinement
  const processBattleResultWithRefinement = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🔄 [REFINEMENT_PROCESSING_DEBUG] Processing battle with refinement support`);
    return originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
  }, [originalProcessBattleResult]);

  // Add clearAllSuggestions placeholder
  const clearAllSuggestions = useCallback(() => {
    console.log('🔄 [SUGGESTIONS_DEBUG] Clearing all suggestions');
  }, []);

  // CRITICAL FIX: All custom hooks that depend on state must be called after state is defined
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

  // CRITICAL FIX: Pass generateRankings to handlers
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
    refinementQueue.clearRefinementQueue,
    milestoneHandlers.generateRankings  // CRITICAL: Pass the generateRankings function
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

  // CRITICAL FIX: All useEffect hooks must be called in the same order every time
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

  // CRITICAL FIX: All useEffect hooks must be called unconditionally
  useEffect(() => {
    const percentage = milestoneHandlers.calculateCompletionPercentage();
    console.log(`🔧 [COMPLETION_DEBUG] Calculated completion percentage: ${percentage}% for ${battlesCompleted} battles`);
    setCompletionPercentage(percentage);
  }, [battlesCompleted, milestoneHandlers]);

  useEffect(() => {
    console.log(`🔧 [STATE_DEBUG] showingMilestone effect triggered - value: ${showingMilestone}`);
    if (showingMilestone) {
      console.log(`🔧 [STATE_DEBUG] Milestone is showing - finalRankings length: ${finalRankings.length}`);
      if (finalRankings.length > 0) {
        console.log(`🔧 [STATE_DEBUG] Sample rankings:`, finalRankings.slice(0, 3).map(p => `${p.name} (${p.id})`));
      }
    }
  }, [showingMilestone, finalRankings]);

  useEffect(() => {
    console.log(`🔧 [STATE_DEBUG] finalRankings effect triggered - length: ${finalRankings.length}`);
    if (finalRankings.length > 0) {
      console.log(`🔧 [STATE_DEBUG] Top 5 rankings:`, finalRankings.slice(0, 5).map(p => `${p.name} (${p.id}) - score: ${p.score}`));
    }
  }, [finalRankings]);

  useEffect(() => {
    console.log(`🔧 [STATE_DEBUG] battlesCompleted effect triggered - value: ${battlesCompleted}`);
  }, [battlesCompleted]);

  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] useBattleStateCore returning state object`);
  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] Final state summary:`);
  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] - currentBattle length: ${currentBattle.length}`);
  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] - battlesCompleted: ${battlesCompleted}`);
  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] - showingMilestone: ${showingMilestone}`);
  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] - finalRankings length: ${finalRankings.length}`);

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
