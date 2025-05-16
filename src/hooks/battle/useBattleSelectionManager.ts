
import { useState, useRef, useCallback } from "react";
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

  const handlePokemonSelect = useCallback((id: number, battleType: BattleType, currentBattle: Pokemon[]) => {
    console.log(`useBattleSelectionManager: Handling selection for id: ${id}, battleType: ${battleType}`);
    
    // Prevent processing if already in progress
    if (isProcessingRef.current) {
      console.log(`useBattleSelectionManager: Ignoring selection, processing in progress`);
      return;
    }
    
    if (battleType === "pairs") {
      // Set processing flag
      isProcessingRef.current = true;
      
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
      
      // Reset processing flag after a small delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 200);
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
  }, [selectedPokemon, setBattleHistory, setSelectedPokemon, processBattleResult]);

  const handleTripletSelectionComplete = useCallback((battleType: BattleType, currentBattle: Pokemon[]) => {
    // Skip if we're in pairs mode (already handled in handlePokemonSelect)
    if (battleType === "pairs") {
      console.log("useBattleSelectionManager: Skipping triplet completion for pairs mode");
      return;
    }
    
    // Prevent processing if already in progress
    if (isProcessingRef.current) {
      console.log(`useBattleSelectionManager: Ignoring triplet completion, processing in progress`);
      return;
    }
    
    console.log("useBattleSelectionManager: Triplet selection complete with selections:", selectedPokemon);
    
    // For triplets mode, process selections if we have any
    if (selectedPokemon.length > 0) {
      // Set processing flag
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
      
      // Reset processing flag after a small delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 200);
    }
  }, [selectedPokemon, setBattleHistory, processBattleResult, setSelectedPokemon]);

  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete
  };
}, []);
