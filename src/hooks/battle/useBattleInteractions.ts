
import { useState } from "react";
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

  // Get current generation from localStorage
  const getCurrentGeneration = () => {
    const storedGeneration = localStorage.getItem('pokemon-ranker-generation');
    return storedGeneration ? Number(storedGeneration) : 0;
  };
  
  const handlePokemonSelect = (id: number) => {
    console.log("BattleCard: Clicked Pokemon:", id, currentBattle.find(p => p.id === id)?.name);
    console.log("useBattleInteractions: Handling selection for Pokemon ID", id, "in", battleType, "mode");
    
    if (isProcessing) {
      console.log("useBattleInteractions: Already processing, ignoring click");
      return;
    }
    
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
      
      // Small delay to allow UI to update before processing
      setTimeout(() => {
        try {
          // Get current generation for proper rankings
          const currentGeneration = getCurrentGeneration();
          
          // Process the battle result directly with the current battle Pokemon
          if (currentBattle && currentBattle.length > 0) {
            // Check if this battle will reach a milestone BEFORE processing the result
            // This is important because we want to know if the NEXT battlesCompleted value hits a milestone
            const nextBattlesCompleted = battlesCompleted + 1;
            const isMilestone = checkIfMilestone(nextBattlesCompleted);
            
            console.log(`Battle #${nextBattlesCompleted}: Is milestone? ${isMilestone}`);
            
            // Now process the battle result, which will increment battlesCompleted internally
            processBattleResult(newSelected, currentBattle, battleType, currentGeneration);
            
            console.log("useBattleInteractions: Battle processed successfully, battles completed:", battlesCompleted + 1);
          }
        } catch (error) {
          console.error("useBattleInteractions: Error processing battle result:", error);
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

  // Helper function to check if a battle count is a milestone
  const checkIfMilestone = (battleCount: number): boolean => {
    // Check common milestones: 10, 25, 50, 100, etc.
    const commonMilestones = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
    
    // Exact milestone match
    if (commonMilestones.includes(battleCount)) {
      toast({
        title: "Milestone Reached!",
        description: `You've completed ${battleCount} battles. Check out your current ranking!`,
      });
      return true;
    }
    
    // Every 50 battles after 100
    if (battleCount > 100 && battleCount % 50 === 0) {
      toast({
        title: "Milestone Reached!",
        description: `You've completed ${battleCount} battles. Check out your current ranking!`,
      });
      return true;
    }
    
    return false;
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
    isProcessing
  };
};
