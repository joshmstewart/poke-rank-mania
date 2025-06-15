import { useState, useCallback, useEffect, useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleGeneration } from "./useBattleGeneration";
import { useBattleRankings } from "./useBattleRankings";
import { useBattleMilestones } from "./useBattleMilestones";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStatePersistence } from "@/hooks/useBattleStatePersistence";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🔧 [BATTLE_STATE_CORE] Initializing with ${allPokemon.length} Pokemon`);
  
  // DEPRECATED: This hook is now a no-op, all persistence is via TrueSkill store.
  useBattleStatePersistence();
  
  const { totalBattles, processBattle } = useTrueSkillStore();
  
  // CRITICAL FIX: The source of truth for battle count is now the TrueSkill store.
  const [battlesCompleted, setBattlesCompleted] = useState(totalBattles);

  // Basic state
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [battleResults, setBattleResults] = useState<any[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<any[]>([]);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [activeTier, setActiveTier] = useState<any>("All");
  const [isBattleTransitioning, setIsBattleTransitioning] = useState(false);
  const [isAnyProcessing, setIsAnyProcessing] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Use smaller hooks
  const { generateNewBattle, addToRecentlyUsed, resetRecentlyUsed } = useBattleGeneration(allPokemon);
  const { generateRankingsFromTrueSkill } = useBattleRankings();
  const { milestones, checkForMilestone } = useBattleMilestones();
  
  // CRITICAL: Get shared refinement queue
  const refinementQueue = useSharedRefinementQueue();

  // Sync local state when store changes. This ensures UI updates correctly.
  useEffect(() => {
    console.log(`🔧 [BATTLE_STATE_CORE] Syncing battlesCompleted from store: ${totalBattles}`);
    setBattlesCompleted(totalBattles);
  }, [totalBattles]);

  // Start new battle with refinement queue support
  const startNewBattle = useCallback(() => {
    console.log(`🚀 [START_NEW_BATTLE] Starting new ${battleType} battle`);
    console.log(`🚀 [START_NEW_BATTLE] Checking refinement queue...`);
    
    // CRITICAL: Log store state before generating new battle
    const preNewBattleRatings = getAllRatings();
    const preNewBattleCount = Object.keys(preNewBattleRatings).length;
    console.log(`🚀 [START_NEW_BATTLE] Store has ${preNewBattleCount} ratings before generating new battle`);
    
    if (refinementQueue) {
      console.log(`🚀 [START_NEW_BATTLE] Refinement queue state: hasRefinementBattles=${refinementQueue.hasRefinementBattles}, count=${refinementQueue.refinementBattleCount}`);
    }
    
    const result = generateNewBattle(battleType, battlesCompleted, refinementQueue);
    if (result.battle.length > 0) {
      setCurrentBattle(result.battle);
      setSelectedPokemon([]);
      console.log(`🚀 [START_NEW_BATTLE] New battle set: ${result.battle.map(p => p.name).join(' vs ')}`);
      console.log(`🚀 [START_NEW_BATTLE] Strategy used: ${result.strategy}`);
      
      // CRITICAL: Log store state after generating new battle
      const postNewBattleRatings = getAllRatings();
      const postNewBattleCount = Object.keys(postNewBattleRatings).length;
      console.log(`🚀 [START_NEW_BATTLE] Store has ${postNewBattleCount} ratings after generating new battle`);
      
      if (postNewBattleCount !== preNewBattleCount) {
        console.log(`🚀 [START_NEW_BATTLE] ⚠️ RATING COUNT CHANGED during battle generation! ${preNewBattleCount} → ${postNewBattleCount}`);
      }
      
      // DEPRECATED: Battle state is no longer saved to legacy localStorage.
    } else {
      console.error(`🚀 [START_NEW_BATTLE] Failed to generate battle`);
    }
  }, [battleType, generateNewBattle, battlesCompleted, refinementQueue, battleHistory, battleResults, getAllRatings]);

  // CRITICAL FIX: Complete reset function that resets everything
  const performCompleteReset = useCallback(() => {
    console.log(`🔄 [COMPLETE_RESET] Starting complete reset of all battle state`);
    
    // CRITICAL: Log store state before reset
    const preResetRatings = getAllRatings();
    const preResetCount = Object.keys(preResetRatings).length;
    console.log(`🔄 [COMPLETE_RESET] Store has ${preResetCount} ratings before reset`);
    
    // Reset all state immediately
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setCurrentBattle([]);
    setSelectedPokemon([]);
    setShowingMilestone(false);
    setRankingGenerated(false);
    setFinalRankings([]);
    setConfidenceScores([]);
    setCompletionPercentage(0);
    setIsProcessingResult(false);
    setIsBattleTransitioning(false);
    setIsAnyProcessing(false);
    
    // Reset recently used Pokemon
    resetRecentlyUsed();
    
    // DEPRECATED: Legacy `saveBattleCount` call removed. Store reset is handled separately.
    
    console.log(`🔄 [COMPLETE_RESET] All battle state reset to initial values`);
    
    // CRITICAL: Log store state after reset
    setTimeout(() => {
      const postResetRatings = getAllRatings();
      const postResetCount = Object.keys(postResetRatings).length;
      console.log(`🔄 [COMPLETE_RESET] Store has ${postResetCount} ratings after reset`);
      
      if (postResetCount !== preResetCount) {
        console.log(`🔄 [COMPLETE_RESET] ⚠️ Store rating count changed during reset: ${preResetCount} → ${postResetCount}`);
      }
    }, 50);
    
    // Start a new battle after a short delay
    setTimeout(() => {
      console.log(`🔄 [COMPLETE_RESET] Starting new battle after reset`);
      startNewBattle();
    }, 100);
  }, [resetRecentlyUsed, startNewBattle, getAllRatings]);

  // CRITICAL FIX: Listen for restart events and reset all state
  useEffect(() => {
    const handleBattleSystemReset = (event: CustomEvent) => {
      console.log(`🔄 [BATTLE_RESET_LISTENER] Received battle-system-reset event:`, event.detail);
      performCompleteReset();
    };

    document.addEventListener('battle-system-reset', handleBattleSystemReset as EventListener);
    
    return () => {
      document.removeEventListener('battle-system-reset', handleBattleSystemReset as EventListener);
    };
  }, [performCompleteReset]);

  // Pokemon selection handler with proper recent tracking
  const handlePokemonSelect = useCallback((pokemonId: number) => {
    console.log(`🎯🎯🎯 [POKEMON_SELECT] ===== Pokemon Selection =====`);
    console.log(`🎯🎯🎯 [POKEMON_SELECT] Pokemon ${pokemonId} selected`);
    
    if (isProcessingResult) {
      console.log(`🎯🎯🎯 [POKEMON_SELECT] Already processing, ignoring selection`);
      return;
    }

    const newSelection = [...selectedPokemon, pokemonId];
    setSelectedPokemon(newSelection);

    if (battleType === "pairs" && newSelection.length === 1) {
      console.log(`🎯🎯🎯 [POKEMON_SELECT] Pairs battle completed`);
      
      addToRecentlyUsed(currentBattle);
      
      // NEW: Centralized battle processing
      const winnerId = newSelection[0];
      const loser = currentBattle.find(p => p.id !== winnerId);
      if (loser) {
        console.log(`🔥🔥🔥 [BATTLE_PROCESSOR] Processing pair battle. Winner: ${winnerId}, Loser: ${loser.id}`);
        processBattle([[String(winnerId)], [String(loser.id)]]);
      } else {
        console.error(`🔥🔥🔥 [BATTLE_PROCESSOR] Could not find loser in pair battle.`);
      }
      
      setBattleHistory(prev => [...prev, { battle: currentBattle, selected: newSelection }]);
      setSelectedPokemon([]); // Reset selection for next battle
        
      // Use the store's battle count for milestone check.
      const newBattlesCompleted = totalBattles + 1;
        
      // Check for milestone BEFORE starting next battle
      const hitMilestone = checkForMilestone(newBattlesCompleted);
      
      if (hitMilestone) {
        console.log(`🎯🎯🎯 [POKEMON_SELECT] Milestone hit, showing milestone screen`);
        setShowingMilestone(true);
        
        // Generate rankings from TrueSkill store
        const rankings = generateRankingsFromTrueSkill();
        setFinalRankings(rankings);
        setRankingGenerated(true);
      } else {
        console.log(`🎯🎯🎯 [POKEMON_SELECT] No milestone hit, starting next battle`);
        setTimeout(() => {
          startNewBattle();
        }, 100);
      }
    }
  }, [
    selectedPokemon, 
    battleType, 
    currentBattle, 
    isProcessingResult, 
    addToRecentlyUsed, 
    processBattle,
    totalBattles,
    battleHistory, 
    checkForMilestone, 
    startNewBattle, 
    generateRankingsFromTrueSkill
  ]);

  // Triplet selection handler
  const handleTripletSelectionComplete = useCallback(() => {
    if (battleType === "triplets" && selectedPokemon.length === 2) {
      console.log(`🎯 [TRIPLET_SELECT] Triplet battle completed, processing result`);
      
      addToRecentlyUsed(currentBattle);
      
      // NEW: Centralized battle processing
      const winnerId = selectedPokemon[0];
      const runnerUpId = selectedPokemon[1];
      const loser = currentBattle.find(p => p.id !== winnerId && p.id !== runnerUpId);

      if (loser) {
        console.log(`🔥🔥🔥 [BATTLE_PROCESSOR] Processing triplet battle. Ranks: ${winnerId}, ${runnerUpId}, ${loser.id}`);
        processBattle(
          [[String(winnerId)], [String(runnerUpId)], [String(loser.id)]],
          [0, 1, 2] // Ranks: 0=1st, 1=2nd, 2=3rd
        );
      } else {
         console.error(`🔥🔥🔥 [BATTLE_PROCESSOR] Could not find loser in triplet battle.`);
      }
      
      setBattleHistory(prev => [...prev, { battle: currentBattle, selected: selectedPokemon }]);
      setSelectedPokemon([]);
        
      const newBattlesCompleted = totalBattles + 1;
      const hitMilestone = checkForMilestone(newBattlesCompleted);
      
      if (hitMilestone) {
        setShowingMilestone(true);
        const rankings = generateRankingsFromTrueSkill();
        setFinalRankings(rankings);
        setRankingGenerated(true);
      } else {
        setTimeout(() => {
          startNewBattle();
        }, 100);
      }
    }
  }, [
    battleType,
    selectedPokemon,
    currentBattle,
    totalBattles,
    addToRecentlyUsed,
    processBattle,
    battleHistory,
    checkForMilestone,
    startNewBattle,
    generateRankingsFromTrueSkill,
  ]);

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

  // ... keep existing code (stub functions for compatibility)
  const goBack = useCallback(() => {
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
      setBattleHistory(prev => prev.slice(0, -1));
      setBattleResults(prev => prev.slice(0, -1));
      // This is imperfect as it doesn't revert TrueSkill, but it's a simple UI undo
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
    console.log(`📊 [GENERATE_RANKINGS] Generating rankings from TrueSkill store`);
    const rankings = generateRankingsFromTrueSkill();
    setFinalRankings(rankings);
    setRankingGenerated(true);
  }, [generateRankingsFromTrueSkill]);

  const performFullBattleReset = useCallback(() => {
    performCompleteReset();
  }, [performCompleteReset]);

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
