
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { BattleResult, BattleType } from "./types";

export const useBattleProcessor = (
  battleResults: BattleResult,
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  startNewBattle: (pokemon: Pokemon[], battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: BattleResult) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
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
      const winner = currentBattle.find(p => selections.includes(p.id));
      const loser = currentBattle.find(p => !selections.includes(p.id));
      
      if (winner && loser) {
        console.log(`Adding pair result: ${winner.name} beats ${loser.name}`);
        newResults.push({ winner, loser });
      } else {
        console.error("Invalid selection for pair battle", selections, currentBattle);
        return; // Don't continue if we can't determine winner/loser
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
      } else {
        console.error("Invalid selection for triplet battle", selections, currentBattle);
        return; // Don't continue if we can't determine winners/losers
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
    setSelectedPokemon([]);
  };

  return { processBattleResult };
};
