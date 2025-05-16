
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";
import { useBattleProcessor } from "./useBattleProcessor";
import { useBattleNavigation } from "./useBattleNavigation";
import { useBattleSelectionManager } from "./useBattleSelectionManager";

export const useBattleManager = (
  battleResults: BattleResult,
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  startNewBattle: (pokemon: Pokemon[], battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: BattleResult) => void,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Use the refactored battle processor for handling battle results
  const { processBattleResult, isProcessingResult } = useBattleProcessor(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    allPokemon,
    startNewBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon
  );
  
  // Use the battle navigation for handling back navigation
  const { goBack } = useBattleNavigation(
    battleHistory,
    setBattleHistory,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    setSelectedPokemon
  );
  
  // Get current generation from localStorage for passing to processBattleResult
  const getCurrentGeneration = () => {
    const storedGeneration = localStorage.getItem('pokemon-ranker-generation');
    return storedGeneration ? Number(storedGeneration) : 0;
  };
  
  // Use the selection manager for handling Pokemon selections
  const {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete
  } = useBattleSelectionManager(
    battleHistory,
    setBattleHistory,
    (selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
      // Get current generation to pass to processBattleResult
      const currentGeneration = getCurrentGeneration();
      processBattleResult(selections, currentBattle, battleType, currentGeneration);
    },
    setSelectedPokemon
  );
  
  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect: (id: number, battleType: BattleType, currentBattle: Pokemon[]) => 
      handlePokemonSelect(id, battleType, currentBattle),
  handleTripletSelectionComplete: (battleType: BattleType, currentBattle: Pokemon[]) => {
      // The 'selectedPokemon' variable here comes from the useBattleSelectionManager hook.
      // It should contain the ID of the Pokemon selected in 'pairs' mode.
      // The 'processBattleResult' variable here comes from the useBattleProcessor hook.
      // The 'getCurrentGeneration' function is defined earlier in useBattleManager.ts.
      // The 'handleTripletSelectionComplete' called in the 'else' block refers to the one
      // destructured from useBattleSelectionManager earlier in useBattleManager.ts.

      if (battleType === "pairs") {
        // For "pairs" mode:
        // Directly process the result using the main battle processor.
        // This ensures battlesCompleted, battleResults, history are updated,
        // and then the next battle should be started by the processor.
        console.log("useBattleManager: Processing battle result for pairs mode with selections:", selectedPokemon);
        const currentGeneration = getCurrentGeneration();
        processBattleResult(selectedPokemon, currentBattle, battleType, currentGeneration);
      } else {
        // For "triplets" mode:
        // Use the existing logic, which calls the handleTripletSelectionComplete 
        // from useBattleSelectionManager. This function handles triplet-specific 
        // selection management and then calls the main processBattleResult (from processor)
        // via a callback.
        handleTripletSelectionComplete(battleType, currentBattle);
      }
    },
    goBack,
    isProcessingResult
  };
};
