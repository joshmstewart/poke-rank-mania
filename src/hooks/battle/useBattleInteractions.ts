
import { useState, useRef, useCallback } from "react";
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
  handleNavigateBack: () => void,
  battleType: BattleType
) => {
  console.log("useBattleInteractions initialized with battleType:", battleType);
  
  // Track if we're currently processing a selection to prevent double processing
  const isProcessingRef = useRef(false);
  
  // Create a direct callback function for handling pokemon selection
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`Handling Pokemon selection (id: ${id}) in ${battleType} mode`);
    
    // Prevent double processing
    if (isProcessingRef.current) {
      console.log("Already processing a selection, ignoring this click");
      return;
    }
    
    // Set processing flag
    isProcessingRef.current = true;
    
    if (battleType === "pairs") {
      console.log("Pairs mode: Setting selection and processing");
      
      // Set the selection
      setSelectedPokemon([id]);
      
      // Add to history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Process the selection completion immediately
      handleTripletSelectionComplete();
      
      // Reset processing flag after a small delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 200);
    } else {
      // For triplets mode - toggle selection
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(id)
          ? prev.filter(pokemonId => pokemonId !== id)
          : [...prev, id];
        console.log("New triplet selection:", newSelection);
        return newSelection;
      });
      
      // Reset processing flag
      isProcessingRef.current = false;
    }
  }, [battleType, currentBattle, setSelectedPokemon, setBattleHistory, handleTripletSelectionComplete]);

  const handleGoBack = useCallback(() => {
    handleNavigateBack();
  }, [handleNavigateBack]);

  return {
    handlePokemonSelect,
    handleGoBack
  };
};
