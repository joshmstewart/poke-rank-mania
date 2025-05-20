
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
    // Explicitly set showingMilestone to false to fix the continue button issue
    console.log("handleContinueBattles: Resetting milestone flag");
    
    // First reset the milestone flag, but use setTimeout to avoid render loops
    setShowingMilestone(false);
    
    // Then start a new battle with sufficient delay to ensure state updates
    setTimeout(() => {
      console.log("Starting new battle after milestone");
      // Double-check that we're not showing a milestone before starting a new battle
      setShowingMilestone(false);
      startNewBattle(battleType);
    }, 200); // Increased delay to ensure state propagation
  };

  const handleNewBattleSet = () => {
    // Use setTimeout to avoid render loops when resetting multiple states
    setTimeout(() => {
      setBattleResults([]);
      setBattlesCompleted(0);
      setRankingGenerated(false);
      setBattleHistory([]);
      setShowingMilestone(false);
      setCompletionPercentage(0);
      startNewBattle(battleType);
    }, 0);
  };

  return {
    handleContinueBattles,
    handleNewBattleSet
  };
};
