import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleCoordinatorState } from "./useBattleCoordinatorState";
import { useBattleCoordination } from "./useBattleCoordination";
import { useBattleProcessor } from "./useBattleProcessor";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { useBattleStateProcessors } from "./useBattleStateProcessors";
import { usePokemonContext } from "@/contexts/PokemonContext";

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
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
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

  // CRITICAL: Initialize the battle result processor with proper logging
  const { processResult: processResultFromProcessor, isProcessing } = useBattleResultProcessor(
    battleResults,
    setBattleResults
  );

  // Create a stable wrapper for battle processing that ensures TrueSkill updates
  const stableSetCurrentBattle = useCallback((battle: Pokemon[]) => {
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Setting current battle: ${battle.map(p => p.name)}`);
    setCurrentBattle(battle);
  }, []);

  const stableSetSelectedPokemon = useCallback((pokemon: number[]) => {
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Setting selected pokemon: ${pokemon}`);
    setSelectedPokemon(pokemon);
  }, []);

  // CRITICAL: Create the main battle processing function
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
  }, [processResultFromProcessor, setBattlesCompleted]);

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
    async () => { }
  );

  const coordination = useBattleCoordination(
    selectedGeneration,
    battleResults,
    finalRankings,
    currentBattle,
    stableSetCurrentBattle,
    stableSetSelectedPokemon,
    activeTier,
    () => {} // freezePokemonForTier placeholder
  );

  const milestoneEvents = {
    originalProcessBattleResult: processBattleResult
  };

  const { setFinalRankingsWithLogging, processBattleResultWithRefinement, clearAllSuggestions } = useBattleStateProcessors(
    { setFinalRankings },
    milestoneEvents,
    () => coordination.startNewBattle(battleType)
  );

  // Event handlers
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Pokemon selected: ${id}`);
    
    if (battleType === "pairs") {
      console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Pairs mode - processing battle immediately`);
      
      // For pairs, immediately process the battle
      const currentBattlePokemon = currentBattle;
      if (currentBattlePokemon.length === 2) {
        processBattleResult([id], currentBattlePokemon, battleType, selectedGeneration);
      }
    } else {
      // For triplets, add to selection
      setSelectedPokemon(prev => [...prev, id]);
    }
  }, [battleType, currentBattle, processBattleResult, selectedGeneration]);

  const handleTripletSelectionComplete = useCallback(() => {
    if (selectedPokemon.length > 0 && currentBattle.length > 0) {
      console.log(`🚨🚨🚨 [BATTLE_STATE_CRITICAL] Triplet selection complete: ${selectedPokemon}`);
      processBattleResult(selectedPokemon, currentBattle, battleType, selectedGeneration);
    }
  }, [selectedPokemon, currentBattle, battleType, selectedGeneration, processBattleResult]);

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
    milestones: coordination.milestones,
    resetMilestones: coordination.resetMilestones,
    calculateCompletionPercentage: coordination.calculateCompletionPercentage,
    getSnapshotForMilestone: coordination.getSnapshotForMilestone,
    generateRankings: coordination.generateRankings,
    handleSaveRankings: coordination.handleSaveRankings,
    freezePokemonForTier: coordination.freezePokemonForTier,
    isPokemonFrozenForTier: coordination.isPokemonFrozenForTier,
    suggestRanking: coordination.suggestRanking,
    removeSuggestion: coordination.removeSuggestion,
    clearAllSuggestions,
    handleContinueBattles: () => {
      coordination.setShowingMilestone(false);
      coordination.startNewBattle(battleType);
    },
    resetMilestoneInProgress: () => console.log("Reset milestone"),
    performFullBattleReset: () => console.log("Full reset"),
    handleManualReorder: () => console.log("Manual reorder"),
    pendingRefinements,
    onRankingsUpdate: setFinalRankingsWithLogging
  };
};
