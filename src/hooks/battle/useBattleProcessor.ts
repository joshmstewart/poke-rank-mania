
import { useState, useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleProgression } from "./useBattleProgression";
import { useNextBattleHandler } from "./useNextBattleHandler";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { useBattleProcessorMilestone } from "./useBattleProcessorMilestone";
import { useBattleProcessorCore } from "./useBattleProcessorCore";
import { useBattleProcessorGeneration } from "./useBattleProcessorGeneration";

export const useBattleProcessor = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: SingleBattle[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  activeTier?: TopNOption,
  freezePokemonForTier?: (pokemonId: number, tier: TopNOption) => void,
  battleStarter?: any,
  markSuggestionUsed?: (pokemon: RankedPokemon, fullyUsed?: boolean) => void,
  isResettingRef?: React.MutableRefObject<boolean>,
  integratedStartNewBattle?: (battleType: BattleType) => Pokemon[]
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);

  console.log(`🔄 [PROCESSOR_FIX] useBattleProcessor isProcessingResult:`, {
    isProcessingResult,
    timestamp: new Date().toISOString()
  });

  // LOADING STATE DEBUG: Log isProcessingResult changes
  useEffect(() => {
    console.log(`🔄 [LOADING DEBUG] useBattleProcessor isProcessingResult changed:`, {
      isProcessingResult,
      timestamp: new Date().toISOString()
    });
  }, [isProcessingResult]);

  const { 
    incrementBattlesCompleted,
    resetMilestone: resetBattleProgressionMilestoneTracking
  } = useBattleProgression(
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );

  const { setupNextBattle } = useNextBattleHandler(
    allPokemon,
    (battleType: BattleType) => {
      console.log(`📝 [PROCESSOR_FIX] setupNextBattle called - delegating to outcome processor`);
      return [];
    },
    setSelectedPokemon
  );

  const { processResult } = useBattleResultProcessor(
    battleResults,
    setBattleResults,
    activeTier,
    freezePokemonForTier,
    battleStarter?.trackLowerTierLoss
  );

  const { 
    milestoneInProgressRef,
    handleMilestone,
    resetMilestoneInProgress
  } = useBattleProcessorMilestone(
    setShowingMilestone,
    generateRankings,
    allPokemon
  );

  const { processBattleCore } = useBattleProcessorCore(
    battleResults,
    setBattleResults,
    setSelectedPokemon,
    markSuggestionUsed
  );

  const { generateNewBattle } = useBattleProcessorGeneration(
    battleStarter,
    integratedStartNewBattle,
    setCurrentBattle
  );

  const processBattle = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    const timestamp = new Date().toISOString();
    console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Called`);
    
    if (isProcessingResult || milestoneInProgressRef.current) {
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Already processing, skipping`);
      return;
    }

    console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Setting isProcessingResult = true`);
    setIsProcessingResult(true);
    
    try {
      // Check if we need to reset battle count due to reset
      if (isResettingRef?.current) {
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Reset flag TRUE. Current battlesCompleted prop = ${battlesCompleted}. Forcing base for increment to 0 by calling setBattlesCompleted(0).`);
        setBattlesCompleted(0);
        console.log(`📝 [${timestamp}] PROCESS BATTLE: ✅ battlesCompleted state updated to 0 via prop setter.`);
        
        isResettingRef.current = false;
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Cleared isResettingRef.current to false AFTER using it.`);
      }
      
      const updatedResults = processBattleCore(
        selectedPokemonIds,
        currentBattlePokemon,
        processResult,
        battleType,
        timestamp
      );

      if (!updatedResults) {
        console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Setting isProcessingResult = false (no results)`);
        setIsProcessingResult(false);
        return;
      }

      const milestone = incrementBattlesCompleted(updatedResults);
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Battle completed, new count: ${battlesCompleted + 1}, Milestone hit: ${milestone !== null ? milestone : "none"}`);
      
      if (milestone !== null) {
        handleMilestone(milestone, updatedResults, currentSelectedGeneration, timestamp);
      } else {
        generateNewBattle(battleType, timestamp);
      }

      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] Clearing isProcessingResult`);
      setIsProcessingResult(false);
      
    } catch (e) {
      console.error(`📝 [${timestamp}] PROCESS BATTLE: Error:`, e);
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] Setting isProcessingResult = false (after error)`);
      setIsProcessingResult(false);
    }
  }, [
    battleResults,
    processResult,
    incrementBattlesCompleted,
    generateRankings,
    setSelectedPokemon,
    allPokemon,
    markSuggestionUsed,
    battlesCompleted,
    isProcessingResult,
    setBattlesCompleted,
    setBattleResults,
    isResettingRef,
    battleStarter,
    integratedStartNewBattle,
    setCurrentBattle,
    milestoneInProgressRef,
    handleMilestone,
    processBattleCore,
    generateNewBattle
  ]);

  return {
    processBattleResult: processBattle,
    isProcessingResult,
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking,
    setBattlesCompleted,
    setBattleResults
  };
};
