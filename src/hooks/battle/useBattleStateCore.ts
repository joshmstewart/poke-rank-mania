import { useState, useCallback, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleGeneration } from "./useBattleGeneration";
import { useBattleRankings } from "./useBattleRankings";
import { useBattleMilestones } from "./useBattleMilestones";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStatePersistence } from "@/hooks/useBattleStatePersistence";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🔧 [BATTLE_STATE_CORE] Initializing with ${allPokemon.length} Pokemon`);
  
  const { loadBattleCount, saveBattleCount, loadBattleState, saveBattleState } = useBattleStatePersistence();
  
  // ENHANCED: Load battle count from persistence
  const [battlesCompleted, setBattlesCompleted] = useState(() => {
    const savedCount = loadBattleCount();
    console.log(`🔧 [BATTLE_STATE_CORE] Loaded saved battle count: ${savedCount}`);
    return savedCount;
  });

  // Basic state
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [battleResults, setBattleResults] = useState<any[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [finalRankings, setFinalRankings] = useState<any[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<any[]>([]);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [activeTier, setActiveTier] = useState<any>("All");
  const [isBattleTransitioning, setIsBattleTransitioning] = useState(false);
  const [isAnyProcessing, setIsAnyProcessing] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Use smaller hooks
  const { generateNewBattle, addToRecentlyUsed, resetRecentlyUsed } = useBattleGeneration(allPokemon);
  const { generateRankingsFromBattleHistory } = useBattleRankings();
  const { milestones, checkForMilestone } = useBattleMilestones();
  
  // CRITICAL FIX: Get shared refinement queue
  const refinementQueue = useSharedRefinementQueue();

  // ENHANCED: Save battle count whenever it changes
  useEffect(() => {
    saveBattleCount(battlesCompleted);
    console.log(`🔧 [BATTLE_STATE_CORE] Saved battle count: ${battlesCompleted}`);
  }, [battlesCompleted, saveBattleCount]);

  // ENHANCED: Load battle state on mount
  useEffect(() => {
    const savedState = loadBattleState();
    if (savedState) {
      console.log(`🔧 [BATTLE_STATE_CORE] Loading saved battle state`);
      setCurrentBattle(savedState.currentBattle || []);
      setSelectedPokemon(savedState.selectedPokemon || []);
      setBattleHistory(savedState.battleHistory || []);
      setBattleResults(savedState.battleResults || []);
      console.log(`🔧 [BATTLE_STATE_CORE] Restored battle state with ${savedState.battleHistory?.length || 0} history items`);
    }
  }, [loadBattleState]);

  // Start new battle with refinement queue support
  const startNewBattle = useCallback(() => {
    console.log(`🚀 [START_NEW_BATTLE] Starting new ${battleType} battle`);
    console.log(`🚀 [START_NEW_BATTLE] Checking refinement queue...`);
    
    if (refinementQueue) {
      console.log(`🚀 [START_NEW_BATTLE] Refinement queue state: hasRefinementBattles=${refinementQueue.hasRefinementBattles}, count=${refinementQueue.refinementBattleCount}`);
    }
    
    const newBattle = generateNewBattle(battleType, battlesCompleted, refinementQueue);
    if (newBattle.length > 0) {
      setCurrentBattle(newBattle);
      setSelectedPokemon([]);
      console.log(`🚀 [START_NEW_BATTLE] New battle set: ${newBattle.map(p => p.name).join(' vs ')}`);
      
      // ENHANCED: Save battle state including current battle
      const stateToSave = {
        battlesCompleted,
        currentBattle: newBattle,
        selectedPokemon: [],
        battleHistory,
        battleResults,
        lastBattleTimestamp: new Date().toISOString()
      };
      saveBattleState(stateToSave);
    } else {
      console.error(`🚀 [START_NEW_BATTLE] Failed to generate battle`);
    }
  }, [battleType, generateNewBattle, battlesCompleted, refinementQueue, battleHistory, battleResults, saveBattleState]);

  // Pokemon selection handler with proper recent tracking
  const handlePokemonSelect = useCallback((pokemonId: number) => {
    console.log(`🎯🎯🎯 [POKEMON_SELECT] ===== Pokemon Selection =====`);
    console.log(`🎯🎯🎯 [POKEMON_SELECT] Pokemon ${pokemonId} selected`);
    console.log(`🎯🎯🎯 [POKEMON_SELECT] Current battle: ${currentBattle.map(p => `${p.name}(${p.id})`).join(' vs ')}`);
    
    if (isProcessingResult) {
      console.log(`🎯🎯🎯 [POKEMON_SELECT] Already processing, ignoring selection`);
      return;
    }

    const newSelection = [...selectedPokemon, pokemonId];
    setSelectedPokemon(newSelection);

    if (battleType === "pairs" && newSelection.length === 1) {
      console.log(`🎯🎯🎯 [POKEMON_SELECT] Pairs battle completed`);
      
      const newBattlesCompleted = battlesCompleted + 1;
      console.log(`🎯🎯🎯 [POKEMON_SELECT] New battles completed: ${newBattlesCompleted}`);
      
      // Add current battle Pokemon to recently used IMMEDIATELY
      addToRecentlyUsed(currentBattle);
      
      // Process battle result
      setBattleResults(prev => [...prev, { battle: currentBattle, selected: newSelection }]);
      setBattleHistory(prev => [...prev, { battle: currentBattle, selected: newSelection }]);
      setBattlesCompleted(newBattlesCompleted);
      setSelectedPokemon([]);
      
      // Check for milestone BEFORE starting next battle
      const hitMilestone = checkForMilestone(newBattlesCompleted);
      
      if (hitMilestone) {
        console.log(`🎯🎯🎯 [POKEMON_SELECT] Milestone hit, showing milestone screen`);
        setShowingMilestone(true);
        
        // Generate rankings from actual battle history
        const newBattleHistory = [...battleHistory, { battle: currentBattle, selected: newSelection }];
        const rankings = generateRankingsFromBattleHistory(newBattleHistory);
        setFinalRankings(rankings);
        setRankingGenerated(true);
      } else {
        console.log(`🎯🎯🎯 [POKEMON_SELECT] No milestone hit, starting next battle`);
        setTimeout(() => {
          startNewBattle();
        }, 100);
      }
    }
  }, [selectedPokemon, battleType, currentBattle, isProcessingResult, battlesCompleted, checkForMilestone, startNewBattle, addToRecentlyUsed, battleHistory, generateRankingsFromBattleHistory]);

  // Triplet selection handler
  const handleTripletSelectionComplete = useCallback(() => {
    if (battleType === "triplets" && selectedPokemon.length === 2) {
      console.log(`🎯 [TRIPLET_SELECT] Triplet battle completed, processing result`);
      
      const newBattlesCompleted = battlesCompleted + 1;
      
      addToRecentlyUsed(currentBattle);
      
      setBattleResults(prev => [...prev, { battle: currentBattle, selected: selectedPokemon }]);
      setBattleHistory(prev => [...prev, { battle: currentBattle, selected: selectedPokemon }]);
      setBattlesCompleted(newBattlesCompleted);
      setSelectedPokemon([]);
      
      const hitMilestone = checkForMilestone(newBattlesCompleted);
      
      if (hitMilestone) {
        setShowingMilestone(true);
        const newBattleHistory = [...battleHistory, { battle: currentBattle, selected: selectedPokemon }];
        const rankings = generateRankingsFromBattleHistory(newBattleHistory);
        setFinalRankings(rankings);
        setRankingGenerated(true);
      } else {
        setTimeout(() => {
          startNewBattle();
        }, 100);
      }
    }
  }, [battleType, selectedPokemon, currentBattle, battlesCompleted, checkForMilestone, startNewBattle, addToRecentlyUsed, battleHistory, generateRankingsFromBattleHistory]);

  // CRITICAL FIX: Listen for refinement queue updates and force new battles
  useEffect(() => {
    const handleRefinementQueueUpdate = (event: CustomEvent) => {
      console.log(`🔄 [REFINEMENT_QUEUE_LISTENER] Received refinement queue update:`, event.detail);
      
      // Small delay to ensure the queue is properly updated
      setTimeout(() => {
        console.log(`🔄 [REFINEMENT_QUEUE_LISTENER] Starting new battle after refinement queue update`);
        startNewBattle();
      }, 100);
    };
    
    const handleForceNextBattle = (event: CustomEvent) => {
      console.log(`🔄 [FORCE_BATTLE_LISTENER] Received force-next-battle event:`, event.detail);
      
      // Clear any existing battle selections
      setSelectedPokemon([]);
      
      // Start new battle immediately
      setTimeout(() => {
        startNewBattle();
      }, 50);
    };
    
    document.addEventListener('refinement-queue-updated', handleRefinementQueueUpdate as EventListener);
    document.addEventListener('force-next-battle', handleForceNextBattle as EventListener);
    
    return () => {
      document.removeEventListener('refinement-queue-updated', handleRefinementQueueUpdate as EventListener);
      document.removeEventListener('force-next-battle', handleForceNextBattle as EventListener);
    };
  }, [startNewBattle]);

  // Initialize first battle when Pokemon are available
  useEffect(() => {
    if (allPokemon.length > 0 && currentBattle.length === 0) {
      console.log(`🚀 [INIT_BATTLE] Initializing first battle with ${allPokemon.length} Pokemon`);
      setTimeout(() => {
        startNewBattle();
      }, 100);
    }
  }, [allPokemon.length, currentBattle.length, startNewBattle]);

  // Stub functions for compatibility
  const goBack = useCallback(() => {
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
      setBattleHistory(prev => prev.slice(0, -1));
      setBattleResults(prev => prev.slice(0, -1));
      setBattlesCompleted(prev => prev - 1);
    }
  }, [battleHistory]);

  const resetMilestones = useCallback(() => {
    setShowingMilestone(false);
    setRankingGenerated(false);
  }, []);

  const calculateCompletionPercentage = useCallback(() => {
    return Math.min((battlesCompleted / 100) * 100, 100);
  }, [battlesCompleted]);

  const getSnapshotForMilestone = useCallback(() => {
    return { battlesCompleted, battleResults, finalRankings };
  }, [battlesCompleted, battleResults, finalRankings]);

  const generateRankings = useCallback(() => {
    console.log(`📊 [GENERATE_RANKINGS] Generating rankings from ${battleResults.length} results`);
    const rankings = generateRankingsFromBattleHistory(battleHistory);
    setFinalRankings(rankings);
    setRankingGenerated(true);
  }, [generateRankingsFromBattleHistory, battleHistory]);

  const performFullBattleReset = useCallback(() => {
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setCurrentBattle([]);
    setSelectedPokemon([]);
    resetRecentlyUsed();
    // ENHANCED: Clear saved state
    saveBattleCount(0);
    startNewBattle();
  }, [startNewBattle, resetRecentlyUsed, saveBattleCount]);

  // ... keep existing code (stub functions for compatibility)
  const handleSaveRankings = useCallback(() => {
    console.log(`💾 [SAVE_RANKINGS] Saving rankings`);
  }, []);

  const freezePokemonForTier = useCallback(() => {}, []);
  const isPokemonFrozenForTier = useCallback(() => false, []);
  const suggestRanking = useCallback(() => {}, []);
  const removeSuggestion = useCallback(() => {}, []);
  const clearAllSuggestions = useCallback(() => {}, []);
  const handleContinueBattles = useCallback(() => {
    setShowingMilestone(false);
    startNewBattle();
  }, [startNewBattle]);
  const resetMilestoneInProgress = useCallback(() => {}, []);
  const handleManualReorder = useCallback(() => {}, []);

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
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack,
    generateRankings,
    handleSaveRankings,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    handleContinueBattles,
    resetMilestoneInProgress,
    performFullBattleReset,
    handleManualReorder,
    pendingRefinements: [],
    refinementBattleCount: 0,
    clearRefinementQueue: () => {},
    startNewBattle
  };
};
