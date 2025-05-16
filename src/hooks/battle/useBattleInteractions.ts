
import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleInteractions = (
  currentBattle: Pokemon[],
  ...
  battleType: BattleType,
  processBattleResult: (selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => void
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

  // NEW: Process the result!
  processBattleResult([id], battleType, currentBattle);

  // Let the UI catch up
  setTimeout(() => {
    setIsProcessing(false);
  }, 100);
}
 else {
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
