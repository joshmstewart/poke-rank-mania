
import { useState, useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { toast } from "@/hooks/use-toast";

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
  handleTripletSelectionComplete: (battleType: BattleType, currentBattle: Pokemon[]) => void,
  handleGoBack: (setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>, battleType: BattleType) => void,
  battleType: BattleType,
  processBattleResult: (selectedPokemonIds: number[], currentBattlePokemon: Pokemon[], battleType: BattleType, currentSelectedGeneration: number) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const consecutiveFailuresRef = useRef(0);
  const lastAttemptRef = useRef(0);
  const lastBattlePokemonIds = useRef<number[]>([]);
  
  // Get current generation from localStorage
  const getCurrentGeneration = () => {
    const storedGeneration = localStorage.getItem('pokemon-ranker-generation');
    return storedGeneration ? Number(storedGeneration) : 0;
  };
  
  // Check if the battle is stuck
  useEffect(() => {
    if (currentBattle && currentBattle.length > 0) {
      const currentIds = currentBattle.map(p => p.id).sort();
      const lastIds = [...lastBattlePokemonIds.current].sort();
      
      // Check if we have the same Pokemon IDs as the previous battle
      const areBattlesIdentical = 
        lastIds.length === currentIds.length && 
        lastIds.every((id, idx) => id === currentIds[idx]);
      
      if (areBattlesIdentical) {
        console.warn(`⚠️ STUCK DETECTION: Same battle detected [${currentIds.join(',')}]. This may indicate a problem.`);
        
        // Only show toast on first detection to avoid spamming
        if (consecutiveFailuresRef.current === 0) {
          toast({
            title: "Warning",
            description: "The same Pokémon keep appearing. Attempting to fix...",
            variant: "destructive"
          });
        }
        
        consecutiveFailuresRef.current++;
        
        // If stuck for 3+ battles, try to fix it by forcing localStorage reset
        if (consecutiveFailuresRef.current >= 3) {
          console.error(`🚨 CRITICAL: Battle appears to be stuck for ${consecutiveFailuresRef.current} consecutive battles`);
          console.log("Attempting emergency reset of Pokemon tracking...");
          
          // Emergency fix: Clear all local storage tracking of recent Pokemon
          try {
            localStorage.removeItem('pokemon-battle-recently-used');
            localStorage.removeItem('pokemon-battle-last-battle');
            
            toast({
              title: "Reset battle tracking",
              description: "Cleared Pokemon history. Next battle should show different Pokemon.",
              variant: "default"
            });
          } catch (e) {
            console.error("Failed to reset tracking:", e);
          }
        }
      } else {
        // Reset the counter if battles are different
        consecutiveFailuresRef.current = 0;
      }
      
      // Save the current battle Pokemon IDs for next comparison
      lastBattlePokemonIds.current = [...currentIds];
    }
  }, [currentBattle]);
  
  const handlePokemonSelect = (id: number) => {
    console.log("BattleCard: Clicked Pokemon:", id, currentBattle.find(p => p.id === id)?.name);
    console.log("useBattleInteractions: Handling selection for Pokemon ID", id, "in", battleType, "mode");
    
    if (isProcessing) {
      console.log("useBattleInteractions: Already processing, ignoring click");
      return;
    }
    
    // Check for too-frequent clicks (potential issue source)
    const now = Date.now();
    if (now - lastAttemptRef.current < 300) {
      console.warn("⚠️ Rapid clicking detected, may cause issues. Adding delay...");
      setTimeout(() => {
        processSelection(id);
      }, 300);
      return;
    }
    
    lastAttemptRef.current = now;
    processSelection(id);
  };
  
  const processSelection = (id: number) => {
    setIsProcessing(true); // Processing starts

    let newSelected: number[];
    
    if (battleType === "pairs") {
      // For pairs, we select exactly one Pokemon as the winner
      newSelected = [id];
      
      // This updates the selected Pokemon state immediately
      setSelectedPokemon(newSelected);
      
      // Save current battle to history
      if (currentBattle && currentBattle.length > 0) {
        const currentBattleCopy = [...currentBattle];
        setBattleHistory(prev => [...prev, { battle: currentBattleCopy, selected: newSelected }]);
      }
      
      // Log the exact Pokemon IDs for diagnosis
      console.log(`🔎 PROCESSING: Battle with ${currentBattle.map(p => `${p.id}:${p.name}`).join(', ')}`);
      console.log(`🔎 PROCESSING: Selected Pokemon ID ${id}`);
      
      // Small delay to allow UI to update before processing
      setTimeout(() => {
        try {
          // Get current generation for proper rankings
          const currentGeneration = getCurrentGeneration();
          
          // Process the battle result directly with the current battle Pokemon
          if (currentBattle && currentBattle.length > 0) {
            // Process the battle result, which will increment battlesCompleted internally
            processBattleResult(newSelected, currentBattle, battleType, currentGeneration);
            
            console.log("useBattleInteractions: Battle processed successfully");
          }
        } catch (error) {
          console.error("useBattleInteractions: Error processing battle result:", error);
          toast({
            title: "Error",
            description: "There was an error processing the battle. Trying to recover...",
            variant: "destructive"
          });
        } finally {
          // Reset processing state regardless of success or failure
          setTimeout(() => {
            setIsProcessing(false);
          }, 500);
        }
      }, 50);
    } else { // triplets mode
      // Logic for triplets (when user is just picking, not confirming the battle outcome yet)
      if (selectedPokemon.includes(id)) {
        newSelected = selectedPokemon.filter(pid => pid !== id);
      } else if (selectedPokemon.length < 3) { 
        newSelected = [...selectedPokemon, id];
      } else {
        // Example: if 3 are already selected, clicking a 4th replaces the first one selected.
        newSelected = [...selectedPokemon.slice(1), id]; 
      }
      setSelectedPokemon(newSelected);
      setIsProcessing(false); 
    }
  };

  const handleGoBackClick = () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    handleGoBack(setCurrentBattle, battleType);
    setIsProcessing(false);
  };
  
  return {
    handlePokemonSelect,
    handleGoBack: handleGoBackClick,
    isProcessing,
    selectedPokemon,
    setSelectedPokemon
  };
};
