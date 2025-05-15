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
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSelectedIdRef = useRef<number | null>(null);
  
  // Keep track of the last processed battle IDs to avoid duplicate processing
  const lastProcessedBattleRef = useRef<number[]>([]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current !== null) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Create a stable callback function for handling pokemon selection
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`Handling Pokemon selection (id: ${id}) in ${battleType} mode. IsProcessing: ${isProcessing}`);
    
    // Prevent double processing
    if (isProcessing) {
      console.log("Already processing a selection, ignoring this click");
      return;
    }
    
    // Check for duplicate clicks on the same Pokemon
    if (lastSelectedIdRef.current === id) {
      console.log("Duplicate click on the same Pokemon, ignoring");
      return;
    }
    
    // Update last selected ID
    lastSelectedIdRef.current = id;
    
    // Force clear any existing timeouts to prevent race conditions
    if (processingTimeoutRef.current !== null) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    // Set processing state immediately to prevent further clicks
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
      
      // Update last processed battle to prevent duplicate processing
      lastProcessedBattleRef.current = currentBattle.map(p => p.id);
      
      // Process the selection completion with a delay to ensure states are updated
      processingTimeoutRef.current = setTimeout(() => {
        console.log("Pairs mode: Calling handleTripletSelectionComplete with delay");
        handleTripletSelectionComplete();
        
        // Allow a longer delay before resetting the processing state
        // This prevents rapid clicking issues while the new battle loads
        processingTimeoutRef.current = setTimeout(() => {
          console.log("Pairs mode: Resetting processing state");
          setIsProcessing(false);
          lastSelectedIdRef.current = null;
        }, 1500);
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
      
      // Reset processing flag after a short delay for triplets
      processingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
        lastSelectedIdRef.current = null;
      }, 300);
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
