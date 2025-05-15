
import { useEffect, useState } from "react";
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
  goBack: () => void,
  battleTypeParam: BattleType
) => {
  // Use the parameter directly instead of reading from localStorage
  const [battleType, setBattleType] = useState<BattleType>(battleTypeParam);
  
  // Update local state when the parameter changes
  useEffect(() => {
    if (battleTypeParam !== battleType) {
      console.log("useBattleInteractions: Updating battle type from param:", battleTypeParam);
      setBattleType(battleTypeParam);
    }
  }, [battleTypeParam]);
  
  console.log("useBattleInteractions using battleType:", battleType);
  
  const handlePokemonSelect = (id: number) => {
    // Always get the current battle type from the prop value
    console.log(`Handling Pokemon selection (id: ${id}) in ${battleType} mode`);
    
    if (battleType === "pairs") {
      // For pairs, immediately handle the selection as a completed battle
      // First save to battle history
      setBattleHistory([...battleHistory, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Then simulate a triplet completion with just one selected ID
      handleTripletSelectionComplete();
    } else {
      // For trios, toggle selection
      let newSelected;
      if (selectedPokemon.includes(id)) {
        // If already selected, unselect it
        newSelected = selectedPokemon.filter(pokemonId => pokemonId !== id);
      } else {
        // Add to selection
        newSelected = [...selectedPokemon, id];
      }
      console.log("Updating selected pokemon:", newSelected);
      setSelectedPokemon(newSelected);
    }
  };

  const handleGoBack = () => {
    goBack();
  };

  return {
    handlePokemonSelect,
    handleGoBack
  };
};
