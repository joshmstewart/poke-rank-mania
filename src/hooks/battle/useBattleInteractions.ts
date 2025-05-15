
import { useState, useRef } from "react";
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

  // Use useRef instead of a local variable to track processing state
  const isProcessingRef = useRef(false);

  const handlePokemonSelect = (id: number) => {
    console.log(`Handling Pokemon selection (id: ${id}) in ${battleType} mode`);
    
    // Prevent duplicate processing using ref
    if (isProcessingRef.current) {
      console.log("Already processing a selection, ignoring this click");
      return;
    }

    if (battleType === "pairs") {
      // For pairs mode - immediate selection and directly process completion
      console.log("Pairs mode: Setting selection and processing");
      
      // Lock to prevent duplicate processing
      isProcessingRef.current = true;
      
      // Set the selection immediately
      setSelectedPokemon([id]);
      
      // Add to history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Use setTimeout to ensure state updates have time to process
      setTimeout(() => {
        console.log("Processing selection completion after timeout");
        // Important: Call the completion handler after a short delay
        handleTripletSelectionComplete();
        
        // Reset processing lock after completion
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 300);
      }, 50);
    } else {
      // For triplets mode - toggle selection
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(id)
          ? prev.filter(pokemonId => pokemonId !== id)
          : [...prev, id];
        return newSelection;
      });
    }
  };

  const handleGoBack = () => {
    handleNavigateBack();
  };

  return {
    handlePokemonSelect,
    handleGoBack
  };
};
