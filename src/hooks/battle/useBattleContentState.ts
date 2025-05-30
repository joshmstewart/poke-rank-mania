
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleCoordinatorState } from "./useBattleCoordinatorState";
import { useBattleCoordination } from "./useBattleCoordination";
import { useBattleProcessor } from "./useBattleProcessor";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { useBattleStateProcessors } from "./useBattleStateProcessors";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useBattleMilestones } from "./useBattleMilestones";

export const useBattleContentState = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number,
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>,
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>
) => {
  const instanceRef = useRef(`battle-content-${Date.now()}`);
  const isResettingRef = useRef(false);
  
  // State initialization
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResultsInternal] = useState<SingleBattle[]>([]);
  const [battlesCompleted, setBattlesCompletedInternal] = useState(0);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [activeTier, setActiveTier] = useState<string>("25");
  const [isBattleTransitioning, setIsBattleTransitioning] = useState(false);
  const [pendingRefinements] = useState<Set<number>>(new Set());

  console.log(`🔧 [BATTLE_CONTENT_STATE] Instance: ${instanceRef.current}`);

  // Get milestone functionality
  const { milestones, checkForMilestone } = useBattleMilestones();

  // CRITICAL: Initialize the battle result processor with proper logging
  const { processResult: processResultFromProcessor, isProcessing } = useBattleResultProcessor(
    battleResults,
    setBattleResultsInternal
  );

  // Create a stable wrapper for battle processing that ensures TrueSkill updates
  const stableSetCurrentBattle = useCallback((battle: Pokemon[]): void => {
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Setting current battle: ${battle.map(p => p.name)}`);
    setCurrentBattle(battle);
  }, []);

  const stableSetSelectedPokemon = useCallback((pokemon: number[]): void => {
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Setting selected pokemon: ${pokemon}`);
    setSelectedPokemon(pokemon);
  }, []);

  // Coordinator state
  useBattleCoordinatorState(
    false,
    allPokemon,
    selectedGeneration,
    battleType,
    battleResults,
    battlesCompleted,
    battleHistory,
    0,
    false,
    () => { },
    () => null,
    async () => { },
    () => { }
  );

  const coordination = useBattleCoordination(
    selectedGeneration,
    battleResults,
    finalRankings,
    currentBattle,
    stableSetCurrentBattle,
    stableSetSelectedPokemon,
    activeTier,
    () => {} // freezePokemonForTier placeholder that returns void
  );

  // CRITICAL: Create the main battle processing function with milestone detection
  const processBattleResult = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] ===== PROCESS BATTLE RESULT CALLED =====`);
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Selected: ${selectedPokemonIds}`);
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Battle: ${currentBattlePokemon.map(p => p.name)}`);
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Type: ${battleType}`);
    
    try {
      // Call the processor directly
      const result = processResultFromProcessor(selectedPokemonIds, battleType, currentBattlePokemon);
      
      if (result) {
        console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] ✅ Battle processed successfully`);
        
        // Update battles completed counter
        setBattlesCompletedInternal(prev => {
          const newCount = prev + 1;
          console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] ✅ Battles completed: ${newCount}`);
          
          // CRITICAL: Check for milestone after updating count
          const isMilestone = checkForMilestone(newCount);
          if (isMilestone) {
            console.log(`🏆🏆🏆 [MILESTONE_HIT] ===== MILESTONE ${newCount} REACHED! =====`);
            
            // CRITICAL FIX: Generate rankings immediately when milestone is hit
            console.log(`🏆🏆🏆 [MILESTONE_FIX] Generating rankings for milestone ${newCount}`);
            
            // FIXED: Ensure result is always flattened to SingleBattle[]
            const resultArray = Array.isArray(result) ? result : [result];
            const updatedResults = [...battleResults, ...resultArray];
            
            // Generate rankings using the coordination system
            const generatedRankings = coordination.generateRankings(updatedResults);
            console.log(`🏆🏆🏆 [MILESTONE_FIX] Generated ${generatedRankings?.length || 0} rankings for milestone`);
            
            // Trigger milestone view
            setTimeout(() => {
              coordination.setShowingMilestone(true);
              console.log(`🏆🏆🏆 [MILESTONE_HIT] Showing milestone view for battle ${newCount}`);
            }, 200); // Slight delay to ensure rankings are set
          }
          
          return newCount;
        });

        // Update external counter if provided
        if (setBattlesCompleted) {
          setBattlesCompleted(prev => prev + 1);
        }

        // Clear selection for next battle
        setSelectedPokemon([]);
        
        return result;
      } else {
        console.error(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] ❌ Battle processing failed`);
        return null;
      }
    } catch (error) {
      console.error(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] ❌ Error in battle processing:`, error);
      return null;
    }
  }, [processResultFromProcessor, setBattlesCompleted, checkForMilestone, battleResults, coordination]);

  // CRITICAL FIX: Create a proper battle generation function
  const generateNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_FIX] ===== generateNewBattle CALLED =====`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_FIX] Battle type: ${battleType}, size: ${battleSize}`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_FIX] Available Pokemon: ${allPokemon.length}`);
    
    if (!allPokemon || allPokemon.length < battleSize) {
      console.error(`🎲🎲🎲 [BATTLE_GENERATION_FIX] ❌ Not enough Pokemon available`);
      return [];
    }
    
    // Simple random selection to fix the repetition issue
    const availablePokemon = [...allPokemon];
    const selectedPokemon: Pokemon[] = [];
    
    // Fisher-Yates shuffle for true randomness
    for (let i = availablePokemon.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePokemon[i], availablePokemon[j]] = [availablePokemon[j], availablePokemon[i]];
    }
    
    // Take the first battleSize Pokemon
    const result = availablePokemon.slice(0, battleSize);
    
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_FIX] ✅ Generated battle: ${result.map(p => p.name).join(' vs ')}`);
    
    return result;
  }, [allPokemon]);

  // CRITICAL FIX: Create a startNewBattle function that actually generates new battles
  const startNewBattle = useCallback((battleType: BattleType): void => {
    console.log(`🚀 [START_NEW_BATTLE_FIX] ===== startNewBattle CALLED =====`);
    console.log(`🚀 [START_NEW_BATTLE_FIX] Battle type: ${battleType}`);
    
    const newBattle = generateNewBattle(battleType);
    if (newBattle && newBattle.length > 0) {
      console.log(`🚀 [START_NEW_BATTLE_FIX] ✅ Setting new battle: ${newBattle.map(p => p.name).join(' vs ')}`);
      stableSetCurrentBattle(newBattle);
    } else {
      console.error(`🚀 [START_NEW_BATTLE_FIX] ❌ Failed to generate new battle`);
    }
  }, [generateNewBattle, stableSetCurrentBattle]);

  const milestoneEvents = {
    originalProcessBattleResult: processBattleResult
  };

  const { setFinalRankingsWithLogging, processBattleResultWithRefinement, clearAllSuggestions } = useBattleStateProcessors(
    { setFinalRankings },
    milestoneEvents,
    () => { 
      // Use our new startNewBattle function
      startNewBattle(battleType);
    }
  );

  // CRITICAL FIX: Initialize first battle on mount
  useEffect(() => {
    if (currentBattle.length === 0 && allPokemon.length > 0) {
      console.log(`🏁 [INITIAL_BATTLE] Generating first battle`);
      startNewBattle(battleType);
    }
  }, [allPokemon.length, currentBattle.length, battleType, startNewBattle]);

  // Event handlers
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Pokemon selected: ${id}`);
    
    if (battleType === "pairs") {
      console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Pairs mode - processing battle immediately`);
      
      // For pairs, immediately process the battle
      const currentBattlePokemon = currentBattle;
      if (currentBattlePokemon.length === 2) {
        processBattleResult([id], currentBattlePokemon, battleType, selectedGeneration).then(() => {
          // After processing, start a new battle
          console.log(`🔄 [BATTLE_FLOW_FIX] Starting new battle after processing`);
          startNewBattle(battleType);
        });
      }
    } else {
      // For triplets, add to selection
      setSelectedPokemon(prev => [...prev, id]);
    }
  }, [battleType, currentBattle, processBattleResult, selectedGeneration, startNewBattle]);

  const handleTripletSelectionComplete = useCallback(() => {
    if (selectedPokemon.length > 0 && currentBattle.length > 0) {
      console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Triplet selection complete: ${selectedPokemon}`);
      processBattleResult(selectedPokemon, currentBattle, battleType, selectedGeneration).then(() => {
        // After processing, start a new battle
        console.log(`🔄 [BATTLE_FLOW_FIX] Starting new battle after triplet processing`);
        startNewBattle(battleType);
      });
    }
  }, [selectedPokemon, currentBattle, battleType, selectedGeneration, processBattleResult, startNewBattle]);

  const goBack = useCallback(() => {
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon(lastBattle.selected);
      setBattleHistory(prev => prev.slice(0, -1));
    }
  }, [battleHistory, setCurrentBattle, setSelectedPokemon, setBattleHistory]);

  return {
    instanceRef,
    currentBattle,
    battleResults,
    battlesCompleted,
    showingMilestone: coordination.showingMilestone,
    setShowingMilestone: coordination.setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage: coordination.completionPercentage,
    rankingGenerated: coordination.rankingGenerated,
    selectedPokemon,
    battleType,
    setBattleType,
    finalRankings,
    confidenceScores,
    battleHistory,
    activeTier,
    setActiveTier,
    isBattleTransitioning,
    isAnyProcessing: isProcessing,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack: () => console.log("Go back"),
    isProcessingResult: isProcessing,
    milestones,
    resetMilestones: coordination.resetMilestones,
    calculateCompletionPercentage: coordination.calculateCompletionPercentage,
    getSnapshotForMilestone: coordination.getSnapshotForMilestone,
    generateRankings: coordination.generateRankings,
    handleSaveRankings: coordination.handleSaveRankings,
    freezePokemonForTier: () => console.log("Freeze pokemon"),
    isPokemonFrozenForTier: () => false,
    suggestRanking: coordination.suggestRanking,
    removeSuggestion: coordination.removeSuggestion,
    clearAllSuggestions,
    handleContinueBattles: () => {
      coordination.setShowingMilestone(false);
      startNewBattle(battleType);
    },
    resetMilestoneInProgress: () => console.log("Reset milestone"),
    performFullBattleReset: () => console.log("Full reset"),
    handleManualReorder: () => console.log("Manual reorder"),
    pendingRefinements,
    onRankingsUpdate: setFinalRankingsWithLogging
  };
};
