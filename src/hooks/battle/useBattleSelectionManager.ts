
import { useState } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePokemonSelect = (id: number, battleType: BattleType, currentBattle: Pokemon[]) => {
    // Prevent processing while another selection is in progress
    if (isProcessing) return;
    
    console.log(`handlePokemonSelect called with id: ${id}, battleType: ${battleType}`);
    
    if (battleType === "pairs") {
      // For pairs mode, immediately process the battle
      setIsProcessing(true);
      
      // Save current battle to history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Set the selected Pokémon
      setLocalSelectedPokemon([id]);
      setSelectedPokemon([id]);
      
      // Process the battle result directly
      processBattleResult([id], battleType, currentBattle);
      
      // Reset processing state after a delay
      setTimeout(() => setIsProcessing(false), 300);
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
    }
  };

  const handleTripletSelectionComplete = (battleType: BattleType, currentBattle: Pokemon[]) => {
    // Prevent duplicate processing
    if (isProcessing) return;
    
    console.log("Triplet selection complete. Battle type:", battleType);
    console.log("Current battle:", currentBattle.map(p => p.name));
    
    // If it's pairs mode, we should return early - we already processed it
    if (battleType === "pairs") {
      console.log("Pairs mode - selection was already processed in handlePokemonSelect");
      return;
    }
    
    // For triplets mode, process selections if we have any
    if (selectedPokemon.length > 0) {
      setIsProcessing(true);
      console.log("Using triplet selections from state:", selectedPokemon);
      
      // Save current battle to history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [...selectedPokemon] 
      }]);
      
      processBattleResult(selectedPokemon, battleType, currentBattle);
      
      // Reset selections after processing
      setLocalSelectedPokemon([]);
      setSelectedPokemon([]);
      
      // Reset processing flag
      setTimeout(() => setIsProcessing(false), 300);
    }
  };

  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete
  };
};
