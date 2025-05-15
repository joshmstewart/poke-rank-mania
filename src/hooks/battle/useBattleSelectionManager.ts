
import { useState, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleSelectionManager = (
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  processBattleResult: (selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [selectedPokemon, setLocalSelectedPokemon] = useState<number[]>([]);
  // Add a processing flag to prevent duplicate handling
  const isProcessingRef = useRef(false);

  const handlePokemonSelect = (id: number, battleType: BattleType, currentBattle: Pokemon[]) => {
    console.log(`useBattleSelectionManager: Handling selection for id: ${id}, battleType: ${battleType}`);
    
    if (battleType === "pairs") {
      // For pairs mode, immediately process the battle
      // Save current battle to history first
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Set the selected Pokémon
      setLocalSelectedPokemon([id]);
      setSelectedPokemon([id]);
      
      console.log(`useBattleSelectionManager: Selected Pokémon ID ${id} for pairs mode`);
      
      // Process the battle result immediately
      processBattleResult([id], battleType, currentBattle);
    } else {
      // For triplets/trios, toggle selection
      let newSelected;
      if (selectedPokemon.includes(id)) {
        // If already selected, unselect it
        newSelected = selectedPokemon.filter(pokemonId => pokemonId !== id);
      } else {
        // Add to selection
        newSelected = [...selectedPokemon, id];
      }
      setLocalSelectedPokemon(newSelected);
      setSelectedPokemon(newSelected);
      console.log(`useBattleSelectionManager: Updated triplet selection to:`, newSelected);
    }
  };

  const handleTripletSelectionComplete = (battleType: BattleType, currentBattle: Pokemon[]) => {
    // Skip if we're in pairs mode
    if (battleType === "pairs") {
      return;
    }
    
    console.log("useBattleSelectionManager: Triplet selection complete with selections:", selectedPokemon);
    
    // For triplets mode, process selections if we have any
    if (selectedPokemon.length > 0) {
      // Save current battle to history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [...selectedPokemon] 
      }]);
      
      // Process immediately
      processBattleResult(selectedPokemon, battleType, currentBattle);
      
      // Reset selections after processing
      setLocalSelectedPokemon([]);
      setSelectedPokemon([]);
    }
  };

  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete
  };
};
