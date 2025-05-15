
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
  // Initialize with the value from localStorage
  const [battleType, setBattleType] = useState<BattleType>(
    localStorage.getItem('pokemon-ranker-battle-type') === "triplets" ? "triplets" : "pairs"
  );
  
  // Update battleType whenever localStorage changes
  useEffect(() => {
    const storedType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
    if (storedType && (storedType === "pairs" || storedType === "triplets") && storedType !== battleType) {
      console.log("useBattleInteractions: Updating battle type from localStorage:", storedType);
      setBattleType(storedType);
    }
  }, [currentBattle]); // Re-check whenever the current battle changes
  
  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pokemon-ranker-battle-type') {
        const newType = e.newValue as BattleType;
        if (newType && (newType === "pairs" || newType === "triplets") && newType !== battleType) {
          console.log("useBattleInteractions: Storage event updated battle type to:", newType);
          setBattleType(newType);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [battleType]);
  
  console.log("useBattleInteractions using battleType:", battleType, 
              "param was:", battleTypeParam);
  
  const handlePokemonSelect = (id: number) => {
    const currentBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
    console.log(`Handling Pokemon selection (id: ${id}) in ${currentBattleType} mode`);
    
    if (currentBattleType === "pairs") {
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
