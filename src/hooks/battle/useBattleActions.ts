
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";

export const useBattleActions = (
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  startNewBattle: (pokemonList: Pokemon[], battleType: BattleType) => void,
  generateRankings: (results: BattleResult) => void,
  battleType: BattleType
) => {
  const handleContinueBattles = () => {
    // Explicitly set showingMilestone to false to fix the continue button issue
    console.log("handleContinueBattles: Resetting milestone flag");
    
    // First reset the milestone flag
    setShowingMilestone(false);
    
    // Then start a new battle with sufficient delay
    setTimeout(() => {
      console.log("Starting new battle after milestone");
      startNewBattle(allPokemon, battleType);
    }, 150);
  };

  const handleNewBattleSet = () => {
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    startNewBattle(allPokemon, battleType);
  };

  return {
    handleContinueBattles,
    handleNewBattleSet
  };
};
