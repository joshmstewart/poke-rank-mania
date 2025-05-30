
import { useCallback } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleProcessorState } from "./useBattleProcessorState";
import { useBattleProcessorResult } from "./useBattleProcessorResult";
import { useBattleProcessorCoordinator } from "./useBattleProcessorCoordinator";
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
  integratedStartNewBattle?: (battleType: BattleType) => Pokemon[],
  setFinalRankings?: React.Dispatch<React.SetStateAction<RankedPokemon[]>>
) => {
  const { isProcessingResult, setIsProcessingResult } = useBattleProcessorState();

  const {
    incrementBattlesCompleted,
    resetBattleProgressionMilestoneTracking,
    processResult
  } = useBattleProcessorCoordinator(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    allPokemon,
    setCurrentBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon,
    activeTier,
    freezePokemonForTier,
    battleStarter
  );

  const { processResultLogic } = useBattleProcessorResult(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    setSelectedPokemon,
    markSuggestionUsed
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
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] ===== PROCESS BATTLE START =====`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] Timestamp: ${timestamp}`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] Selected Pokemon: ${selectedPokemonIds}`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] Current battle: ${currentBattlePokemon.map(p => p.name)}`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] Battle type: ${battleType}`);
    console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Called`);
    
    if (isProcessingResult || milestoneInProgressRef.current) {
      console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] ❌ Already processing, skipping`);
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Already processing, skipping`);
      return;
    }

    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] ✅ Setting isProcessingResult = true`);
    console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Setting isProcessingResult = true`);
    setIsProcessingResult(true);
    
    try {
      const updatedResults = processResultLogic(
        selectedPokemonIds,
        currentBattlePokemon,
        processResult,
        battleType,
        timestamp,
        isResettingRef
      );

      if (!updatedResults) {
        console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] ❌ No results, setting isProcessingResult = false`);
        console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Setting isProcessingResult = false (no results)`);
        setIsProcessingResult(false);
        return;
      }

      const milestone = incrementBattlesCompleted(updatedResults);
      console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] Battle completed, new count: ${battlesCompleted + 1}, Milestone hit: ${milestone !== null ? milestone : "none"}`);
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Battle completed, new count: ${battlesCompleted + 1}, Milestone hit: ${milestone !== null ? milestone : "none"}`);
      
      if (milestone !== null) {
        console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] ===== MILESTONE ${milestone} HIT - HANDLING =====`);
        handleMilestone(milestone, updatedResults, currentSelectedGeneration, timestamp);
      } else {
        console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] ===== NO MILESTONE - CALLING generateNewBattle =====`);
        console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] About to call generateNewBattle with:`);
        console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] - battleType: ${battleType}`);
        console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] - timestamp: ${timestamp}`);
        
        const result = generateNewBattle(battleType, timestamp);
        console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] generateNewBattle returned: ${result}`);
      }

      console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] ✅ Clearing isProcessingResult`);
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] Clearing isProcessingResult`);
      setIsProcessingResult(false);
      
    } catch (e) {
      console.error(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] ❌ ERROR:`, e);
      console.error(`📝 [${timestamp}] PROCESS BATTLE: Error:`, e);
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] Setting isProcessingResult = false (after error)`);
      setIsProcessingResult(false);
    }
    
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_ULTRA_TRACE] ===== PROCESS BATTLE END =====`);
  }, [
    isProcessingResult,
    milestoneInProgressRef,
    setIsProcessingResult,
    processResultLogic,
    processResult,
    incrementBattlesCompleted,
    battlesCompleted,
    handleMilestone,
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
