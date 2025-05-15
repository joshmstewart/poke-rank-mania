
import { Pokemon } from "@/services/pokemon";
import { BattleType, BattleResult } from "./types";
import { toast } from "@/hooks/use-toast";

export const useBattleNavigation = (
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  battleResults: BattleResult,
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const goBack = (setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>, battleType: BattleType) => {
    if (battleHistory.length === 0) {
      toast({
        title: "No previous battles",
        description: "There are no previous battles to return to."
      });
      return;
    }
    
    // Remove the last battle result
    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);
    
    // Also remove the last result from battleResults
    const newResults = [...battleResults];
    
    // Calculate how many results to remove based on the battle type and selections
    let resultsToRemove = 1; // Default for pairs
    if (battleType === "triplets" && lastBattle) {
      const selectedCount = lastBattle.selected.length;
      const unselectedCount = lastBattle.battle.length - selectedCount;
      resultsToRemove = selectedCount * unselectedCount;
    }
    
    // Remove the appropriate number of results
    newResults.splice(newResults.length - resultsToRemove, resultsToRemove);
    setBattleResults(newResults);
    
    // Decrement battles completed
    setBattlesCompleted(battlesCompleted - 1);
    
    // Set the current battle back to the previous one
    if (lastBattle) {
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }
    
    // If we were showing a milestone, go back to battles
    setShowingMilestone(false);
  };

  return { goBack };
};
