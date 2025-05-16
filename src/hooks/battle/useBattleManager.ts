
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
      handleTripletSelectionComplete(battleType, currentBattle);
      if (battleType === "pairs") {
        // Trigger the next battle manually
        console.log("useBattleManager: Starting next battle for pairs mode");
        startNewBattle(allPokemon, battleType);
      }
    },
    goBack,
    isProcessingResult
  };
};
