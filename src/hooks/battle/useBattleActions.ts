import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleActions = (
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  startNewBattle: (battleType: BattleType) => void,
  generateRankings: (results: SingleBattle[]) => void,
  battleType: BattleType
) => {
  const [isActioning, setIsActioning] = useState(false);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const milestoneStateRef = useRef<boolean>(false);

  // Keep track of the milestone state to avoid infinite update loops
  useEffect(() => {
    // No state updates in this effect
    return () => {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
    };
  }, []);

  // Update our ref when the prop changes
  useEffect(() => {
    // Only track changes, don't set state here
    milestoneStateRef.current = false;
  }, []);

  const handleContinueBattles = useCallback(() => {
    if (isActioning) return;
    setIsActioning(true);
    
    // Clear any existing timeout to prevent race conditions
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    
    // Close milestone view first
    actionTimeoutRef.current = setTimeout(() => {
      // Update our ref first
      milestoneStateRef.current = false;
      
      // Then update state
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
      // Reset all state sequentially to avoid render loops
      milestoneStateRef.current = false;
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
