
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { toast } from "@/hooks/use-toast";

export const useBattleNavigation = (
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const goBack = (
    setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
    battleType: BattleType
  ) => {
    if (battleHistory.length === 0) {
      toast({
        title: "No previous battles",
        description: "There are no previous battles to return to."
      });
      return;
    }

    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);

    const newResults = [...battleResults];

    let resultsToRemove = 1;
    if (battleType === "triplets" && lastBattle) {
      const selectedCount = lastBattle.selected.length;
      const unselectedCount = lastBattle.battle.length - selectedCount;
      resultsToRemove = selectedCount * unselectedCount;
    }

    newResults.splice(newResults.length - resultsToRemove, resultsToRemove);
    setBattleResults(newResults);

    setBattlesCompleted(battlesCompleted - 1);

    if (lastBattle) {
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }

    setShowingMilestone(false);
  };

  return { goBack };
};
