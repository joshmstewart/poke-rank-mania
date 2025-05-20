
import { useState, useCallback, useRef } from "react";
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

  const handleContinueBattles = useCallback(() => {
    if (isActioning) return;
    setIsActioning(true);
    
    // Clear any existing timeout to prevent race conditions
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    
    // First reset the milestone flag
    setShowingMilestone(false);
    
    // Use setTimeout to ensure state updates are processed before starting new battle
    actionTimeoutRef.current = setTimeout(() => {
      // Start a new battle after milestone display is closed
      startNewBattle(battleType);
      setIsActioning(false);
      actionTimeoutRef.current = null;
    }, 200);
  }, [battleType, setShowingMilestone, startNewBattle, isActioning]);

  const handleNewBattleSet = useCallback(() => {
    if (isActioning) return;
    setIsActioning(true);
    
    // Clear any existing timeout to prevent race conditions
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    
    // Use nested timeouts to ensure state updates are processed in sequence
    actionTimeoutRef.current = setTimeout(() => {
      setBattleResults([]);
      setBattlesCompleted(0);
      setRankingGenerated(false);
      setBattleHistory([]);
      setShowingMilestone(false);
      setCompletionPercentage(0);
      
      // Start new battle at the end with a delay to ensure all state resets are processed
      actionTimeoutRef.current = setTimeout(() => {
        startNewBattle(battleType);
        setIsActioning(false);
        actionTimeoutRef.current = null;
      }, 200);
    }, 100);
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
