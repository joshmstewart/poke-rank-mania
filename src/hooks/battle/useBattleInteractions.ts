
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
  
  // Refs to prevent race conditions
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  
  // Safety cleanup on unmount or when dependencies change
  useEffect(() => {
    return () => {
      // Clear all timeouts to prevent memory leaks
      timeoutIdsRef.current.forEach(id => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, []);

  // Safe timeout function that tracks and cleans up timeouts
  const safeTimeout = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      // Remove from tracked timeouts when executed
      timeoutIdsRef.current = timeoutIdsRef.current.filter(t => t !== id);
      callback();
    }, delay);
    
    // Add to tracked timeouts
    timeoutIdsRef.current.push(id);
    return id;
  }, []);
  
  // Clear all pending timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  // Create stable handler for Pokemon selection
  const handlePokemonSelect = useCallback((id: number) => {
    // Check if we're currently processing - use ref for immediate value
    if (isProcessingRef.current) {
      console.log(`useBattleInteractions: Selection ignored for Pokemon ID ${id} - processing in progress`);
      return;
    }
    
    // Set the processing flags immediately to prevent further clicks
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    console.log(`useBattleInteractions: Processing selection for Pokemon ID ${id} in ${battleType} mode`);
    
    // Clear any existing timeouts to prevent conflicts
    clearAllTimeouts();
    
    if (battleType === "pairs") {
      // For pairs mode, we update selection and immediately process
      setSelectedPokemon([id]);
      
      // Update history - important for back navigation
      setBattleHistory(prev => {
        const newHistory = [...prev, { 
          battle: [...currentBattle], 
          selected: [id] 
        }];
        console.log("useBattleInteractions: Updated battle history length:", newHistory.length);
        return newHistory;
      });
      
      // Use safe timeout to ensure state updates complete before proceeding
      safeTimeout(() => {
        console.log("useBattleInteractions: Calling handleTripletSelectionComplete for pairs mode");
        handleTripletSelectionComplete();
        
        // Reset processing state after completion with a delay
        safeTimeout(() => {
          console.log("useBattleInteractions: Resetting processing state to false");
          isProcessingRef.current = false;
          setIsProcessing(false);
        }, 1000);
      }, 300);
    } else {
      // For triplets mode, toggle the selection
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(id)
          ? prev.filter(pokemonId => pokemonId !== id)
          : [...prev, id];
        console.log("useBattleInteractions: New triplet selection:", newSelection);
        return newSelection;
      });
      
      // Reset processing state more quickly for triplets since we're just toggling
      safeTimeout(() => {
        console.log("useBattleInteractions: Resetting processing state after triplet selection");
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 300);
    }
  }, [
    battleType,
    currentBattle,
    setSelectedPokemon,
    setBattleHistory,
    handleTripletSelectionComplete,
    safeTimeout,
    clearAllTimeouts
  ]);

  // Create stable handler for back navigation
  const handleGoBack = useCallback(() => {
    if (isProcessingRef.current) {
      console.log("useBattleInteractions: Back navigation ignored - processing in progress");
      return;
    }
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    console.log("useBattleInteractions: Handling back navigation");
    
    // Clear any existing timeouts first
    clearAllTimeouts();
    
    // Execute navigation after a short delay to ensure UI updates
    safeTimeout(() => {
      handleNavigateBack();
      
      // Reset processing state after navigation
      safeTimeout(() => {
        console.log("useBattleInteractions: Resetting processing state after navigation");
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 500);
    }, 100);
  }, [handleNavigateBack, safeTimeout, clearAllTimeouts]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing
  };
};
