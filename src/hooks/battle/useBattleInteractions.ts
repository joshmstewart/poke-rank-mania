
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
    console.log("BattleCard: Clicked Pokemon:", id, currentBattle.find(p => p.id === id)?.name);
    console.log("useBattleInteractions: Handling selection for Pokemon ID", id, "in", battleType, "mode");
    
    if (isProcessing) {
      console.log("useBattleInteractions: Already processing, ignoring click");
      return;
    }
    
    setIsProcessing(true); // Processing starts

    let newSelected: number[];
    
    if (battleType === "pairs") {
      // For pairs, we select exactly one Pokemon as the winner
      newSelected = [id];
      
      // This updates the selected Pokemon state immediately
      setSelectedPokemon(newSelected);
      
      // Save current battle to history
      const currentBattleCopy = [...currentBattle];
      setBattleHistory(prev => [...prev, { battle: currentBattleCopy, selected: newSelected }]);
      
      // Small delay to allow UI to update before processing
      setTimeout(() => {
        try {
          // Get current generation for proper rankings
          const currentGeneration = getCurrentGeneration();
          
          // Process the battle result directly
          processBattleResult(newSelected, currentBattle, battleType, currentGeneration);
          
          // Increment battles completed
          setBattlesCompleted(prev => prev + 1);
          
          console.log("useBattleInteractions: Battle processed successfully, battles completed:", battlesCompleted + 1);
        } catch (error) {
          console.error("useBattleInteractions: Error processing battle result:", error);
        } finally {
          // Reset processing state regardless of success or failure
          setIsProcessing(false);
        }
      }, 50);
    } else { // triplets mode
      // Logic for triplets (when user is just picking, not confirming the battle outcome yet)
      if (selectedPokemon.includes(id)) {
        newSelected = selectedPokemon.filter(pid => pid !== id);
      } else if (selectedPokemon.length < 3) { 
        newSelected = [...selectedPokemon, id];
      } else {
        // Example: if 3 are already selected, clicking a 4th replaces the first one selected.
        newSelected = [...selectedPokemon.slice(1), id]; 
      }
      setSelectedPokemon(newSelected);
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
