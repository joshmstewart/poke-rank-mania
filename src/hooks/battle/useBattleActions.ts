
import { useState, useCallback } from "react";
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

  const handleContinueBattles = useCallback(() => {
    if (isActioning) return;
    setIsActioning(true);
    
    // First reset the milestone flag
    setShowingMilestone(false);
    
    // Use setTimeout to ensure state updates are processed before starting new battle
    setTimeout(() => {
      // Start a new battle after milestone display is closed
      startNewBattle(battleType);
      setIsActioning(false);
    }, 100);
  }, [battleType, setShowingMilestone, startNewBattle, isActioning]);

  const handleNewBattleSet = useCallback(() => {
    if (isActioning) return;
    setIsActioning(true);
    
    // Reset all state with timeouts to prevent cascading renders
    setTimeout(() => {
      setBattleResults([]);
      setBattlesCompleted(0);
      setRankingGenerated(false);
      setBattleHistory([]);
      setShowingMilestone(false);
      setCompletionPercentage(0);
      
      // Start new battle at the end
      setTimeout(() => {
        startNewBattle(battleType);
        setIsActioning(false);
      }, 50);
    }, 50);
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
