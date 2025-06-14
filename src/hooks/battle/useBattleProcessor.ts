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
    generateRankings,
    setSelectedPokemon,
    activeTier,
    freezePokemonForTier,
    battleStarter
  );

  const { processResultLogic } = useBattleProcessorResult(
    battleResults,
    setBattleResults,
    setBattlesCompleted,
    [],
    'pairs'
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
    allPokemon,
    battlesCompleted,
    setCurrentBattle
  );

  const processBattle = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    if (isProcessingResult || milestoneInProgressRef.current) {
      return;
    }

    setIsProcessingResult(true);
    
    try {
      const updatedResults = processResultLogic(
        selectedPokemonIds,
        currentBattlePokemon,
        processResult,
        battleType,
        new Date().toISOString()
      );

      if (!updatedResults) {
        setIsProcessingResult(false);
        return;
      }

      const milestone = incrementBattlesCompleted(updatedResults);
      
      if (milestone !== null) {
        handleMilestone(milestone, updatedResults, currentSelectedGeneration, new Date().toISOString());
      } else {
        generateNewBattle(battleType, new Date().toISOString());
      }

      setIsProcessingResult(false);
      
    } catch (e) {
      console.error('Battle processing error:', e);
      setIsProcessingResult(false);
    }
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
