
import { Pokemon } from "@/services/pokemon";
import { BattleResult } from "./types";

export const useBattleActions = (
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  startNewBattle: (pokemonList: Pokemon[]) => void,
  generateRankings: (results: BattleResult) => void
) => {
  const handleContinueBattles = () => {
    setShowingMilestone(false);
    startNewBattle(allPokemon);
  };

  const handleNewBattleSet = () => {
    setBattleResults([]);
    setBattlesCompleted(0);
    setRankingGenerated(false);
    setBattleHistory([]);
    setShowingMilestone(false);
    setCompletionPercentage(0);
    startNewBattle(allPokemon);
  };

  return {
    handleContinueBattles,
    handleNewBattleSet
  };
};
