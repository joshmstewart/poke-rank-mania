
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
  // Add a processing flag to prevent duplicate handling and use ref for stability
  const isProcessingRef = useRef(false);

  const handlePokemonSelect = (id: number, battleType: BattleType, currentBattle: Pokemon[]) => {
    // Prevent processing while another selection is in progress
    if (isProcessingRef.current) {
      console.log(`useBattleSelectionManager: Ignoring selection for ${id} - processing in progress`);
      return;
    }
    
    console.log(`useBattleSelectionManager: Handling selection for id: ${id}, battleType: ${battleType}`);
    
    if (battleType === "pairs") {
      // For pairs mode, immediately process the battle
      isProcessingRef.current = true;
      
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
      
      // Reset processing state - this will happen in useBattleProcessor after processing is complete
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
    // Prevent duplicate processing
    if (isProcessingRef.current || battleType === "pairs") {
      console.log("useBattleSelectionManager: Ignoring triplet completion - already processing or pairs mode");
      return;
    }
    
    console.log("useBattleSelectionManager: Triplet selection complete with selections:", selectedPokemon);
    
    // For triplets mode, process selections if we have any
    if (selectedPokemon.length > 0) {
      isProcessingRef.current = true;
      
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
      
      // Reset processing flag happens in useBattleProcessor after processing is complete
    }
  };

  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete
  };
};
