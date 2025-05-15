
import { useState, useCallback, useRef, useEffect } from "react";
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
  // Use a ref to track processing state to avoid state update issues
  const isProcessingRef = useRef(false);
  // Expose a state version for UI rendering
  const [isProcessing, setIsProcessing] = useState(false);
  
  // We'll use these refs to prevent race conditions
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickedIdRef = useRef<number | null>(null);
  
  // Safety cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset processing state - safer with a dedicated function
  const resetProcessingState = useCallback((delay = 300) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log("Resetting processing state to false");
      isProcessingRef.current = false;
      setIsProcessing(false);
      lastClickedIdRef.current = null;
      timeoutRef.current = null;
    }, delay);
  }, []);

  // Create stable handler for Pokemon selection
  const handlePokemonSelect = useCallback((id: number) => {
    // Check if we're currently processing - use ref for immediate value
    if (isProcessingRef.current) {
      console.log(`Selection ignored for Pokemon ID ${id} - currently processing`);
      return;
    }
    
    // Set the processing flags immediately to prevent further clicks
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    console.log(`Processing selection for Pokemon ID ${id} in ${battleType} mode`);
    lastClickedIdRef.current = id;
    
    if (battleType === "pairs") {
      // For pairs mode, we update selection and immediately process
      setSelectedPokemon([id]);
      
      // Update history
      setBattleHistory(prev => {
        const newHistory = [...prev, { 
          battle: [...currentBattle], 
          selected: [id] 
        }];
        console.log("Updated battle history length:", newHistory.length);
        return newHistory;
      });
      
      // Wait for state updates to complete before continuing
      setTimeout(() => {
        // Call completion handler for pairs mode
        handleTripletSelectionComplete();
        
        // Reset processing state after a delay
        resetProcessingState(800);
      }, 300);
    } else {
      // For triplets mode, toggle the selection
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(id)
          ? prev.filter(pokemonId => pokemonId !== id)
          : [...prev, id];
        console.log("New triplet selection:", newSelection);
        return newSelection;
      });
      
      // Reset processing state more quickly for triplets
      resetProcessingState(300);
    }
  }, [
    battleType,
    currentBattle,
    setSelectedPokemon,
    setBattleHistory,
    handleTripletSelectionComplete,
    resetProcessingState
  ]);

  // Create stable handler for back navigation
  const handleGoBack = useCallback(() => {
    if (isProcessingRef.current) {
      console.log("Back navigation ignored - currently processing");
      return;
    }
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    console.log("Handling back navigation");
    handleNavigateBack();
    
    // Reset processing state after navigation
    resetProcessingState(500);
  }, [handleNavigateBack, resetProcessingState]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing
  };
};
