
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
  // Track if processing is happening
  const [isProcessingResult, setIsProcessingResult] = useState(false);

  const processBattleResult = (selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
    // Prevent double processing
    if (isProcessingResult) {
      console.log("Already processing a battle result, ignoring");
      return;
    }
    
    console.log("Processing battle result with selections:", selections);
    console.log("Current battle:", currentBattle.map(p => p.name));
    setIsProcessingResult(true);
    
    if (!currentBattle || currentBattle.length === 0) {
      console.error("No current battle data available");
      setIsProcessingResult(false);
      return;
    }
    
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
        setIsProcessingResult(false);
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
        setIsProcessingResult(false);
        return; // Don't continue if we can't determine winners/losers
      }
    }
    
    // Important: Update battle results first
    setBattleResults(newResults);
    
    // CRITICAL: Increment the battles completed counter BEFORE starting a new battle
    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`Incrementing battles completed from ${battlesCompleted} to ${newBattlesCompleted}`);
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
      
      // Reset processing state after a delay
      setTimeout(() => {
        setIsProcessingResult(false);
      }, 500);
    } else {
      // Reset selections before starting a new battle
      setSelectedPokemon([]);
      
      // Use a timeout to ensure state updates happen first
      setTimeout(() => {
        // Validate allPokemon before starting a new battle
        if (!allPokemon || allPokemon.length < 2) {
          console.error("Not enough Pokémon available for battle:", allPokemon?.length || 0);
          toast({
            title: "Error",
            description: "Not enough Pokémon available for battle",
            variant: "destructive"
          });
          setIsProcessingResult(false);
          return;
        }
        
        console.log(`Starting new battle after completing battle #${newBattlesCompleted}`);
        startNewBattle(allPokemon, battleType);
        
        // Reset processing state after the new battle has started
        setTimeout(() => {
          setIsProcessingResult(false);
        }, 500);
      }, 300);
    }
  };

  return { processBattleResult, isProcessingResult };
};
