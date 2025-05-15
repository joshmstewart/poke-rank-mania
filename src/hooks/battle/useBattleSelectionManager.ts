
import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleSelectionManager = (
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  processBattleResult: (selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [selectedPokemon, setLocalSelectedPokemon] = useState<number[]>([]);

  const handlePokemonSelect = (id: number, battleType: BattleType, currentBattle: Pokemon[]) => {
    // For pairs, immediately process the battle when selection is made
    if (battleType === "pairs") {
      // Save current battle to history before processing
      setBattleHistory([...battleHistory, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Set the selected Pokémon
      setLocalSelectedPokemon([id]);
      setSelectedPokemon([id]);
      
      // Add a small delay to ensure state updates before processing
      setTimeout(() => {
        processBattleResult([id], battleType, currentBattle);
      }, 10);
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
    console.log("Triplet selection complete. Battle type:", battleType);
    console.log("Current battle:", currentBattle.map(p => p.name));
    
    // If it's pairs mode and we already processed the selection in handlePokemonSelect,
    // we can return early to avoid duplicate processing
    if (battleType === "pairs") {
      // For pairs mode, explicitly check if we have a selection
      if (selectedPokemon.length > 0) {
        processBattleResult(selectedPokemon, battleType, currentBattle);
      } else if (battleHistory.length > 0) {
        // Try to get the selection from the most recent history entry
        const lastEntry = battleHistory[battleHistory.length - 1];
        if (lastEntry.selected.length > 0) {
          processBattleResult(lastEntry.selected, battleType, currentBattle);
        }
      }
      return;
    }
    
    // For triplets mode, use the current selections
    if (selectedPokemon.length > 0) {
      console.log("Using triplet selections from state:", selectedPokemon);
      processBattleResult(selectedPokemon, battleType, currentBattle);
      
      // Reset selections after processing
      setLocalSelectedPokemon([]);
    }
  };

  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete
  };
};
