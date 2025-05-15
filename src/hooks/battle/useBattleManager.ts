
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { BattleResult, BattleType } from "./types";

export const useBattleManager = (
  battleResults: BattleResult,
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  startNewBattle: (pokemon: Pokemon[], battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: BattleResult) => void,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [selectedPokemon, setLocalSelectedPokemon] = useState<number[]>([]);

  const handlePokemonSelect = (id: number, battleType: BattleType, currentBattle: Pokemon[]) => {
    // For pairs, immediately process the battle when selection is made
    if (battleType === "pairs") {
      // Save current battle to history before processing
      setBattleHistory([...battleHistory, { 
        battle: [...currentBattle], 
        selected: [id] 
      }]);
      
      processBattleResult([id], battleType, currentBattle);
    } else {
      // For triplets/trios, toggle selection
      let newSelected;
      if (selectedPokemon.includes(id)) {
        // If already selected, unselect it
        newSelected = selectedPokemon.filter(pokemonId => pokemonId !== id);
      } else {
        // Add to selection
        newSelected = [...selectedPokemon, id];
      }
      setLocalSelectedPokemon(newSelected);
      setSelectedPokemon(newSelected);
    }
  };

  const handleTripletSelectionComplete = (battleType: BattleType, currentBattle: Pokemon[]) => {
    // Save current battle to history
    setBattleHistory([...battleHistory, { 
      battle: [...currentBattle], 
      selected: [...selectedPokemon] 
    }]);
    
    processBattleResult(selectedPokemon, battleType, currentBattle);
  };

  const processBattleResult = (selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
    if (!currentBattle || currentBattle.length === 0) {
      console.error("No current battle data available");
      return;
    }

    console.log("Processing battle result with selections:", selections);
    console.log("Current battle:", currentBattle.map(p => p.name));
    
    // Process battle results
    const newResults = [...battleResults];
    
    if (battleType === "pairs") {
      // For pairs, we know who won and who lost
      const winner = currentBattle.find(p => p.id === selections[0]);
      const loser = currentBattle.find(p => p.id !== selections[0]);
      
      if (winner && loser) {
        console.log(`Adding pair result: ${winner.name} beats ${loser.name}`);
        newResults.push({ winner, loser });
      } else {
        console.error("Invalid selection for pair battle", selections, currentBattle);
      }
    } else {
      // For triplets/trios, each selected is considered a "winner" against each unselected
      const winners = currentBattle.filter(p => selections.includes(p.id));
      const losers = currentBattle.filter(p => !selections.includes(p.id));
      
      // Only add results if there are winners AND losers
      if (winners.length > 0 && losers.length > 0) {
        console.log(`Adding ${winners.length} winners against ${losers.length} losers`);
        winners.forEach(winner => {
          losers.forEach(loser => {
            console.log(`- ${winner.name} beats ${loser.name}`);
            newResults.push({ winner, loser });
          });
        });
      }
    }
    
    setBattleResults(newResults);
    const newBattlesCompleted = battlesCompleted + 1;
    setBattlesCompleted(newBattlesCompleted);
    
    // Check if we've hit a milestone
    if (milestones.includes(newBattlesCompleted)) {
      console.log(`Milestone reached at ${newBattlesCompleted} battles!`);
      generateRankings(newResults);
      setShowingMilestone(true);
      
      toast({
        title: "Milestone Reached!",
        description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
      });
    } else {
      // Continue with next battle - Make sure we have the allPokemon list
      console.log("Starting new battle with new Pokémon...", allPokemon?.length || 0);
      
      // Validate allPokemon before starting a new battle
      if (!allPokemon || allPokemon.length < 2) {
        console.error("Not enough Pokémon available for battle:", allPokemon?.length || 0);
        toast({
          title: "Error",
          description: "Not enough Pokémon available for battle",
          variant: "destructive"
        });
        return;
      }
      
      // Start new battle with the full Pokemon list
      startNewBattle(allPokemon, battleType);
    }
    
    // Reset selections
    setLocalSelectedPokemon([]);
    setSelectedPokemon([]);
  };

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
      setLocalSelectedPokemon([]);
      setSelectedPokemon([]);
    }
    
    // If we were showing a milestone, go back to battles
    setShowingMilestone(false);
  };

  return {
    selectedPokemon,
    setSelectedPokemon: setLocalSelectedPokemon,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack
  };
};
