import { useState, useRef, useCallback, useEffect } from "react";
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
  
  // Track if we're currently processing a selection
  const [isProcessing, setIsProcessing] = useState(false);
  const processingTimeoutRef = useRef<number | null>(null);
  
  // Keep track of the last processed battle to avoid duplicates
  const lastProcessedBattleRef = useRef<number[]>([]);
  // Keep track of the last battle completed number
  const lastBattleCompletedRef = useRef<number>(battlesCompleted);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current !== null) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Update the last battle completed ref when the prop changes
  useEffect(() => {
    lastBattleCompletedRef.current = battlesCompleted;
  }, [battlesCompleted]);
  
  // Create a stable callback function for handling pokemon selection
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`Handling Pokemon selection (id: ${id}) in ${battleType} mode. IsProcessing: ${isProcessing}`);
    
    // Prevent double processing
    if (isProcessing) {
      console.log("Already processing a selection, ignoring this click");
      return;
    }
    
    // Check if current battle is the same as last processed battle
    const currentBattleIds = currentBattle.map(p => p.id).sort();
    const lastProcessedIds = [...lastProcessedBattleRef.current].sort();
    
    const isSameBattle = currentBattleIds.length === lastProcessedIds.length &&
      currentBattleIds.every((id, i) => id === lastProcessedIds[i]);
      
    if (isSameBattle && lastProcessedIds.length > 0) {
      console.log("This appears to be the same battle we just processed, forcing a new battle");
      // Set processing flag to prevent further clicks
      setIsProcessing(true);
      
      processingTimeoutRef.current = window.setTimeout(() => {
        handleTripletSelectionComplete();
        
        // Reset processing flag after a suitable delay
        processingTimeoutRef.current = window.setTimeout(() => {
          setIsProcessing(false);
        }, 600);
      }, 100);
      return;
    }
    
    // Set processing state
    setIsProcessing(true);
    
    if (battleType === "pairs") {
      console.log("Pairs mode: Processing selection for ID:", id);
      
      // Set the selection
      setSelectedPokemon([id]);
      
      // Add to history
      setBattleHistory(prev => [...prev, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      // Update last processed battle
      lastProcessedBattleRef.current = currentBattle.map(p => p.id);
      
      // Process the selection completion with a small delay
      // This ensures state updates have time to propagate
      processingTimeoutRef.current = window.setTimeout(() => {
        console.log("Processing selection after delay. Current battle count:", lastBattleCompletedRef.current);
        handleTripletSelectionComplete();
        
        // Reset processing flag after a suitable delay to allow the next battle to load
        processingTimeoutRef.current = window.setTimeout(() => {
          console.log("Resetting processing flag");
          setIsProcessing(false);
        }, 800); // Increased delay to ensure new battle is loaded
      }, 300);
    } else {
      // For triplets mode - toggle selection
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(id)
          ? prev.filter(pokemonId => pokemonId !== id)
          : [...prev, id];
        console.log("New triplet selection:", newSelection);
        return newSelection;
      });
      
      // Reset processing flag immediately for triplets
      setIsProcessing(false);
    }
  }, [
    battleType, 
    currentBattle, 
    isProcessing, 
    setSelectedPokemon, 
    setBattleHistory, 
    handleTripletSelectionComplete
  ]);

  const handleGoBack = useCallback(() => {
    if (isProcessing) {
      console.log("Already processing, ignoring back navigation");
      return;
    }
    handleNavigateBack();
  }, [handleNavigateBack, isProcessing]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing
  };
};
