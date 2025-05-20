
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
  const handleContinueBattles = () => {
    // First reset the milestone flag without starting a chain of renders
    setShowingMilestone(false);
    
    // Use setTimeout to ensure state updates are processed before starting new battle
    setTimeout(() => {
      // Start a new battle after milestone display is closed
      startNewBattle(battleType);
    }, 100);
  };

  const handleNewBattleSet = () => {
    // Reset all state in a single batch to prevent cascading renders
    setTimeout(() => {
      setBattleResults([]);
      setBattlesCompleted(0);
      setRankingGenerated(false);
      setBattleHistory([]);
      setShowingMilestone(false);
      setCompletionPercentage(0);
      startNewBattle(battleType);
    }, 50);
  };

  return {
    handleContinueBattles,
    handleNewBattleSet
  };
};
