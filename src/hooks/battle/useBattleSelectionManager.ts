
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

  const handlePokemonSelect = (id: number, battleType: BattleType, currentBattle: Pokemon[]) => {
    // For pairs, immediately process the battle when selection is made
    if (battleType === "pairs") {
      // Save current battle to history before processing
      setBattleHistory([...battleHistory, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
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
    }
  };

  const handleTripletSelectionComplete = (battleType: BattleType, currentBattle: Pokemon[]) => {
    console.log("Triplet selection complete. Battle type:", battleType);
    console.log("Current battle:", currentBattle.map(p => p.name));
    
    // Find the proper selection to use
    let selectionsToUse: number[] = [];
    
    if (battleType === "pairs") {
      // For pairs, get the most recent history entry or fall back to selectedPokemon
      if (battleHistory.length > 0) {
        const lastEntry = battleHistory[battleHistory.length - 1];
        // Check if the last entry matches the current battle
        const lastBattleIds = lastEntry.battle.map(p => p.id);
        const currentBattleIds = currentBattle.map(p => p.id);
        
        if (lastBattleIds.length === currentBattleIds.length && 
            lastBattleIds.every((id, i) => id === currentBattleIds[i])) {
          selectionsToUse = [...lastEntry.selected];
          console.log("Using selections from matching history:", selectionsToUse);
        } else {
          // If battle doesn't match, check if there's a selection for the current Pokemon
          const selectedIds = currentBattle.filter(p => selectedPokemon.includes(p.id)).map(p => p.id);
          if (selectedIds.length > 0) {
            selectionsToUse = selectedIds;
            console.log("Using selections from filtered currentBattle:", selectionsToUse);
          } else {
            console.error("No valid selections found for current battle");
          }
        }
      } else if (selectedPokemon.length > 0) {
        // If no history but we have selections
        selectionsToUse = [...selectedPokemon];
        console.log("Using selections from state with no history:", selectionsToUse);
      } else {
        console.error("No selections available!");
      }
    } else {
      // For triplets mode, use the current selections
      selectionsToUse = [...selectedPokemon];
      console.log("Using triplet selections from state:", selectionsToUse);
    }
    
    // Process the battle result
    processBattleResult(selectionsToUse, battleType, currentBattle);
    
    // Reset selections after processing
    setLocalSelectedPokemon([]);
  };

  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete
  };
};
