
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
  const { goBack: originalGoBack } = useBattleNavigation(
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

  // Create a simplified goBack function that doesn't require parameters
  const goBack = () => {
    // Get current battle type from localStorage
    const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
    const currentBattleType: BattleType = storedBattleType === "triplets" ? "triplets" : "pairs";
    
    // Create a setCurrentBattle function to pass to originalGoBack
    const setCurrentBattle = (newBattle: React.SetStateAction<Pokemon[]>) => {
      // This is an adapter that will be used by the navigation logic
      // to update the current battle
      if (typeof newBattle === 'function') {
        console.warn("Function updater for currentBattle not supported in goBack adapter");
        return;
      }
      
      // Start a new battle with the provided Pokemon
      startNewBattle(newBattle, currentBattleType);
    };
    
    // Call the original goBack with the required parameters
    originalGoBack(setCurrentBattle, currentBattleType);
  };
  
  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack,
    isProcessingResult
  };
};
