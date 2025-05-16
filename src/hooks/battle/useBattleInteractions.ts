
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleInteractions = (
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  selectedPokemon: number[],
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  handleTripletSelectionComplete: (battleType: BattleType, currentBattle: Pokemon[]) => void,
  handleGoBack: (setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>, battleType: BattleType) => void,
  battleType: BattleType,
  processBattleResult: (selectedPokemonIds: number[], currentBattlePokemon: Pokemon[], battleType: BattleType, currentSelectedGeneration: number) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current generation from localStorage
  const getCurrentGeneration = () => {
    const storedGeneration = localStorage.getItem('pokemon-ranker-generation');
    return storedGeneration ? Number(storedGeneration) : 0;
  };
  
const handlePokemonSelect = (id: number) => {
    console.log("useBattleInteractions: Handling selection for Pokemon ID", id, "in", battleType, "mode");
    
    if (isProcessing) return;
    
    setIsProcessing(true); // Processing starts

    let newSelected: number[];
    
    if (battleType === "pairs") {
      newSelected = [id];
      // This updates the selected Pokemon state that the manager function will use
      setSelectedPokemon(newSelected); 
      
      // Call the comprehensive battle completion logic.
      // 'handleTripletSelectionComplete' is the function from useBattleManager 
      // that handles full turn processing (results, history, starting new battle).
      handleTripletSelectionComplete(battleType, currentBattle); 
      
      // Now that all processing and advancement should be done:
      setIsProcessing(false); // Processing ends
    } else { // triplets mode
      // Logic for triplets (when user is just picking, not confirming the battle outcome yet)
      if (selectedPokemon.includes(id)) {
        newSelected = selectedPokemon.filter(pid => pid !== id);
      } else if (selectedPokemon.length < 3) { 
        newSelected = [...selectedPokemon, id];
      } else {
        // Example: if 3 are already selected, clicking a 4th replaces the first one selected.
        // Adjust this part if triplet selection logic should be different.
        newSelected = [...selectedPokemon.slice(1), id]; 
      }
      setSelectedPokemon(newSelected);
      // For triplets, selecting a Pokemon doesn't mean the battle is processed yet,
      // so isProcessing is set to false quickly. The actual battle processing
      // for triplets happens when a "confirm" button calls handleTripletSelectionComplete.
      setIsProcessing(false); 
    }
  };

  const handleGoBackClick = () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    handleGoBack(setCurrentBattle, battleType);
    setIsProcessing(false);
  };
  
  return {
    handlePokemonSelect,
    handleGoBack: handleGoBackClick,
    isProcessing
  };
};
