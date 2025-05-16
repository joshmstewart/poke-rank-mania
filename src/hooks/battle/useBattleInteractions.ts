
import { useState, useCallback } from "react";
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
  handleTripletSelectionComplete: () => void,
  handleNavigateBack: () => void,
  battleType: BattleType
) => {
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Function to handle Pokemon selection
  const handlePokemonSelect = useCallback((id: number) => {
    // Prevent actions while processing
    if (isProcessing) {
      console.log(`useBattleInteractions: Selection ignored for Pokemon ID ${id} - processing in progress`);
      return;
    }
    
    console.log(`useBattleInteractions: Handling selection for Pokemon ID ${id} in ${battleType} mode`);
    
    if (battleType === "pairs") {
     setIsProcessing(true);

// Update selection and history
setSelectedPokemon([id]);
setBattleHistory(prev => [...prev, { battle: [...currentBattle], selected: [id] }]);

// Let the manager handle what comes next
console.log("useBattleInteractions: Calling handleTripletSelectionComplete");
handleTripletSelectionComplete();

// Clear processing state after short delay to let UI catch up
setTimeout(() => {
  setIsProcessing(false);
}, 100);

    } else {
      // For triplets mode, toggle the selection
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(id)
          ? prev.filter(pokemonId => pokemonId !== id)
          : [...prev, id];
        console.log("useBattleInteractions: New triplet selection:", newSelection);
        return newSelection;
      });
    }
  }, [
    battleType, 
    currentBattle, 
    isProcessing, 
    setBattleHistory, 
    setSelectedPokemon, 
    handleTripletSelectionComplete
  ]);

  // Function to handle back navigation
  const handleGoBack = useCallback(() => {
    if (isProcessing) {
      console.log("useBattleInteractions: Back navigation ignored - processing in progress");
      return;
    }
    
    setIsProcessing(true);
    
    // Execute navigation immediately
    handleNavigateBack();
    
    // Reset processing state after navigation
    setIsProcessing(false);
  }, [handleNavigateBack, isProcessing]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing
  };
};
