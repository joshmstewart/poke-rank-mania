
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
    
    // Prevent selecting when we're already processing a result
    if (isProcessing) return;
    
    setIsProcessing(true);

    // Update selected Pokemon
    let newSelected: number[];
    
    if (battleType === "pairs") {
      // For pairs, we just select this Pokemon and immediately process it against the other one
      newSelected = [id];
      setSelectedPokemon(newSelected);
      
      // Get the current generation from localStorage
      const currentGeneration = getCurrentGeneration();
      
      // Process the result with the selected ID and current battle Pokemon
      processBattleResult(newSelected, currentBattle, battleType, currentGeneration);
    } else {
      // For triplets, toggle the selection
      if (selectedPokemon.includes(id)) {
        newSelected = selectedPokemon.filter(pid => pid !== id);
      } else if (selectedPokemon.length < 3) {
        newSelected = [...selectedPokemon, id];
      } else {
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
