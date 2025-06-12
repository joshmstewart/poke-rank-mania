import { useState, useCallback, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleGeneration } from "./useBattleGeneration";
import { useBattleRankings } from "./useBattleRankings";
import { useBattleMilestones } from "./useBattleMilestones";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStatePersistence } from "@/hooks/useBattleStatePersistence";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useBattleResultProcessor } from "./useBattleResultProcessor";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🔧 [BATTLE_STATE_CORE] Initializing with ${allPokemon.length} Pokemon`);
  
  const { loadBattleCount, saveBattleCount, loadBattleState, saveBattleState } = useBattleStatePersistence();
  const { getAllRatings, removePendingBattle } = useTrueSkillStore();
  
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

  // CRITICAL: Add battle result processor with TrueSkill updates
  const { processBattleForTrueSkill } = useBattleResultProcessor();

  // ENHANCED: Save battle count whenever it changes
  useEffect(() => {
    saveBattleCount(battlesCompleted);
    console.log(`🔧 [BATTLE_STATE_CORE] Saved battle count: ${battlesCompleted}`);
    
    // CRITICAL: Log store state whenever battle count changes
    const currentRatings = getAllRatings();
    const ratingCount = Object.keys(currentRatings).length;
    console.log(`🔧 [BATTLE_STATE_CORE] ===== BATTLE COUNT CHANGED TO ${battlesCompleted} =====`);
    console.log(`🔧 [BATTLE_STATE_CORE] Store currently has ${ratingCount} ratings`);
    if (ratingCount > 0) {
      console.log(`🔧 [BATTLE_STATE_CORE] Current ratings:`, Object.keys(currentRatings).map(id => {
        const rating = currentRatings[parseInt(id)];
        return `ID:${id} μ:${rating.mu.toFixed(2)} battles:${rating.battleCount}`;
      }));
    }
  }, [battlesCompleted, saveBattleCount, getAllRatings]);

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

  // CRITICAL FIX: Enhanced battle processing with TrueSkill updates and pending Pokemon removal
  const processBattleWithFullUpdates = useCallback(async (battlePokemon: Pokemon[], winnerIds: number[]) => {
    console.log(`🔥🔥🔥 [BATTLE_PROCESSING] ===== STARTING FULL BATTLE PROCESSING =====`);
    console.log(`🔥🔥🔥 [BATTLE_PROCESSING] Battle Pokemon:`, battlePokemon.map(p => `${p.name}(${p.id})`));
    console.log(`🔥🔥🔥 [BATTLE_PROCESSING] Winner IDs:`, winnerIds);
    
    try {
      // Step 1: Process TrueSkill ratings
      console.log(`🔥🔥🔥 [BATTLE_PROCESSING] Step 1: Processing TrueSkill ratings`);
      await processBattleForTrueSkill(battlePokemon, winnerIds);
      console.log(`🔥🔥🔥 [BATTLE_PROCESSING] ✅ TrueSkill ratings updated successfully`);
      
      // Step 2: Remove all participating Pokemon from pending battles
      console.log(`🔥🔥🔥 [BATTLE_PROCESSING] Step 2: Removing participating Pokemon from pending battles`);
      battlePokemon.forEach(pokemon => {
        console.log(`🔥🔥🔥 [BATTLE_PROCESSING] Removing Pokemon ${pokemon.name}(${pokemon.id}) from pending battles`);
        removePendingBattle(pokemon.id);
      });
      console.log(`🔥🔥🔥 [BATTLE_PROCESSING] ✅ All participating Pokemon removed from pending battles`);
      
      // Step 3: Log final state
      const updatedRatings = getAllRatings();
      const updatedRatingCount = Object.keys(updatedRatings).length;
      console.log(`🔥🔥🔥 [BATTLE_PROCESSING] ===== BATTLE PROCESSING COMPLETE =====`);
      console.log(`🔥🔥🔥 [BATTLE_PROCESSING] Final store has ${updatedRatingCount} ratings`);
      console.log(`🔥🔥🔥 [BATTLE_PROCESSING] Updated ratings for this battle:`, battlePokemon.map(p => {
        const rating = updatedRatings[p.id.toString()];
        return rating ? `${p.name}: μ=${rating.mu.toFixed(2)} σ=${rating.sigma.toFixed(2)} battles=${rating.battleCount}` : `${p.name}: No rating found`;
      }));
      
      return true;
    } catch (error) {
      console.error(`🔥🔥🔥 [BATTLE_PROCESSING] ❌ Error in battle processing:`, error);
      return false;
    }
  }, [processBattleForTrueSkill, removePendingBattle, getAllRatings]);

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
    
    const newBattle = generateNewBattle(battleType, battlesCompleted, refinementQueue);
    if (newBattle.length > 0) {
      setCurrentBattle(newBattle);
      setSelectedPokemon([]);
      console.log(`🚀 [START_NEW_BATTLE] New battle set: ${newBattle.map(p => p.name).join(' vs ')}`);
      
      // CRITICAL: Log store state after generating new battle
      const postNewBattleRatings = getAllRatings();
      const postNewBattleCount = Object.keys(postNewBattleRatings).length;
      console.log(`🚀 [START_NEW_BATTLE] Store has ${postNewBattleCount} ratings after generating new battle`);
      
      if (postNewBattleCount !== preNewBattleCount) {
        console.log(`🚀 [START_NEW_BATTLE] ⚠️ RATING COUNT CHANGED during battle generation! ${preNewBattleCount} → ${postNewBattleCount}`);
      }
      
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
  }, [battleType, generateNewBattle, battlesCompleted, refinementQueue, battleHistory, battleResults, saveBattleState, getAllRatings]);

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
    
    // Clear persistence
    saveBattleCount(0);
    
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
  }, [resetRecentlyUsed, saveBattleCount, startNewBattle, getAllRatings]);

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

  // CRITICAL FIX: Enhanced Pokemon selection handler with full battle processing
  const handlePokemonSelect = useCallback((pokemonId: number) => {
    console.log(`🎯🎯🎯 [POKEMON_SELECT] ===== Pokemon Selection =====`);
    console.log(`🎯🎯🎯 [POKEMON_SELECT] Pokemon ${pokemonId} selected`);
    console.log(`🎯🎯🎯 [POKEMON_SELECT] Current battle: ${currentBattle.map(p => `${p.name}(${p.id})`).join(' vs ')}`);
    
    // CRITICAL: Log store state at the moment of Pokemon selection
    const selectRatings = getAllRatings();
    const selectRatingCount = Object.keys(selectRatings).length;
    console.log(`🎯🎯🎯 [POKEMON_SELECT] Store has ${selectRatingCount} ratings at moment of selection`);
    
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
      
      // CRITICAL: Process battle with full TrueSkill updates and pending Pokemon removal
      console.log(`🔥🔥🔥 [POKEMON_SELECT_CRITICAL] ===== CALLING ENHANCED BATTLE PROCESSOR =====`);
      
      processBattleWithFullUpdates(currentBattle, newSelection).then((success) => {
        if (success) {
          console.log(`🔥🔥🔥 [POKEMON_SELECT_CRITICAL] ✅ Battle processing completed successfully`);
          
          // Update state
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
        } else {
          console.error(`🔥🔥🔥 [POKEMON_SELECT_CRITICAL] ❌ Battle processing failed`);
        }
      });
    }
  }, [selectedPokemon, battleType, currentBattle, isProcessingResult, battlesCompleted, checkForMilestone, startNewBattle, addToRecentlyUsed, battleHistory, generateRankingsFromBattleHistory, getAllRatings, processBattleWithFullUpdates]);

  // Triplet selection handler
  const handleTripletSelectionComplete = useCallback(() => {
    if (battleType === "triplets" && selectedPokemon.length === 2) {
      console.log(`🎯 [TRIPLET_SELECT] Triplet battle completed, processing result`);
      
      const newBattlesCompleted = battlesCompleted + 1;
      
      addToRecentlyUsed(currentBattle);
      
      // Process triplet battle with full TrueSkill updates and pending Pokemon removal
      processBattleWithFullUpdates(currentBattle, selectedPokemon).then((success) => {
        if (success) {
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
      });
    }
  }, [battleType, selectedPokemon, currentBattle, battlesCompleted, checkForMilestone, startNewBattle, addToRecentlyUsed, battleHistory, generateRankingsFromBattleHistory, processBattleWithFullUpdates]);

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
    setCurrentBattle,
    selectedPokemon,
    setSelectedPokemon,
    battleType,
    setBattleType,
    selectedGeneration,
    setSelectedGeneration,
    battlesCompleted,
    setBattlesCompleted,
    battleResults,
    setBattleResults,
    showingMilestone,
    setShowingMilestone,
    rankingGenerated,
    setRankingGenerated,
    finalRankings,
    setFinalRankings,
    confidenceScores,
    setConfidenceScores,
    battleHistory,
    setBattleHistory,
    activeTier,
    setActiveTier,
    isBattleTransitioning,
    setIsBattleTransitioning,
    isAnyProcessing,
    setIsAnyProcessing,
    isProcessingResult,
    setIsProcessingResult,
    completionPercentage,
    setCompletionPercentage,
    
    // Actions
    startNewBattle,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    performCompleteReset,
    
    // Utilities
    milestones,
    checkForMilestone,
    generateRankingsFromBattleHistory,
    refinementQueue
  };
};
