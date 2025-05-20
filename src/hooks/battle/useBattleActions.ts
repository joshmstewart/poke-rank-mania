
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleActions = (
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setShowingMilestone: (value: boolean) => void,
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
    
    // First step: close the milestone view
    console.log("Closing milestone view");
    setShowingMilestone(false);
    
    // Wait for state update to propagate
    actionTimeoutRef.current = setTimeout(() => {
      console.log("Starting new battle after milestone closed");
      // Start a new battle after milestone display is closed
      startNewBattle(battleType);
      setIsActioning(false);
      actionTimeoutRef.current = null;
    }, 300);
  }, [battleType, setShowingMilestone, startNewBattle, isActioning]);

  const handleNewBattleSet = useCallback(() => {
    if (isActioning) return;
    setIsActioning(true);
    
    // Clear any existing timeout to prevent race conditions
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    
    console.log("Starting new battle set, cleaning up state");
    
    // First step: close the milestone view if it's open
    setShowingMilestone(false);
    
    // Wait for state update to propagate
    actionTimeoutRef.current = setTimeout(() => {
      // Reset all other state in sequence with delays
      setBattleResults([]);
      setBattlesCompleted(0);
      setRankingGenerated(false);
      setBattleHistory([]);
      setCompletionPercentage(0);
      
      // Start new battle at the end with a longer delay
      actionTimeoutRef.current = setTimeout(() => {
        startNewBattle(battleType);
        setIsActioning(false);
        actionTimeoutRef.current = null;
      }, 300);
    }, 300);
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
