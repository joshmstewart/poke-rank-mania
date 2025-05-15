
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
    setShowingMilestone(false);
    startNewBattle(allPokemon, battleType);
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
