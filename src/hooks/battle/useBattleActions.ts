
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleActions = (
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setShowingMilestone: (value: boolean) => void,  // Changed to accept our custom setter
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  startNewBattle: (battleType: BattleType) => void,
  generateRankings: (results: SingleBattle[]) => void,
  battleType: BattleType
) => {
  const [isActioning, setIsActioning] = useState(false);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clean up timeouts on unmount
    return () => {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
    };
  }, []);

  const handleContinueBattles = useCallback(() => {
    if (isActioning) return;
    setIsActioning(true);
    
    // Clear any existing timeout to prevent race conditions
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    
    // First, close the milestone view with a delay to ensure state settles
    actionTimeoutRef.current = setTimeout(() => {
      // Update milestone state to false
      setShowingMilestone(false);
      
      // Use nested timeout to ensure state updates are processed 
      actionTimeoutRef.current = setTimeout(() => {
        // Start a new battle after milestone display is closed
        startNewBattle(battleType);
        setIsActioning(false);
        actionTimeoutRef.current = null;
      }, 300);
    }, 200);
  }, [battleType, setShowingMilestone, startNewBattle, isActioning]);

  const handleNewBattleSet = useCallback(() => {
    if (isActioning) return;
    setIsActioning(true);
    
    // Clear any existing timeout to prevent race conditions
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    
    // Use a single timeout for resetting state
    actionTimeoutRef.current = setTimeout(() => {
      // Reset milestone state first
      setShowingMilestone(false);
      
      // Wait a bit before resetting other state
      setTimeout(() => {
        setBattleResults([]);
        setBattlesCompleted(0);
        setRankingGenerated(false);
        setBattleHistory([]);
        setCompletionPercentage(0);
        
        // Start new battle at the end with a longer delay
        setTimeout(() => {
          startNewBattle(battleType);
          setIsActioning(false);
          actionTimeoutRef.current = null;
        }, 300);
      }, 200);
    }, 200);
  }, [
    battleType, 
    setBattleHistory, 
    setBattleResults, 
    setBattlesCompleted, 
    setCompletionPercentage, 
    setRankingGenerated, 
    setShowingMilestone, 
    startNewBattle,
    isActioning
  ]);

  return {
    handleContinueBattles,
    handleNewBattleSet,
    isActioning
  };
};
