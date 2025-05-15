
import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { BattleType } from "./types";

export const useBattleProcessor = (
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  startNewBattle: (pokemon: Pokemon[], battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: any[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Processing state
  const [isProcessingResult, setIsProcessingResult] = useState(false);

  // Process the battle result
  const processBattleResult = useCallback((selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
    // Prevent processing if already in progress
    if (isProcessingResult) {
      console.log("useBattleProcessor: Already processing a battle result, ignoring");
      return;
    }
    
    console.log("useBattleProcessor: Processing battle result with selections:", selections);
    
    // Set processing flag
    setIsProcessingResult(true);
    
    if (!currentBattle || currentBattle.length === 0) {
      console.error("useBattleProcessor: No current battle data available");
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
        console.log(`useBattleProcessor: Adding pair result: ${winner.name} beats ${loser.name}`);
        newResults.push({ winner, loser });
      } else {
        console.error("useBattleProcessor: Invalid selection for pair battle", selections, currentBattle);
        setIsProcessingResult(false);
        return;
      }
    } else {
      // For triplets/trios, each selected is considered a "winner" against each unselected
      const winners = currentBattle.filter(p => selections.includes(p.id));
      const losers = currentBattle.filter(p => !selections.includes(p.id));
      
      if (winners.length > 0 && losers.length > 0) {
        winners.forEach(winner => {
          losers.forEach(loser => {
            newResults.push({ winner, loser });
          });
        });
      } else {
        console.error("useBattleProcessor: Invalid selection for triplet battle", selections, currentBattle);
        setIsProcessingResult(false);
        return;
      }
    }
    
    // Update battle results
    setBattleResults(newResults);
    
    // Increment battles completed
    const newBattlesCompleted = battlesCompleted + 1;
    setBattlesCompleted(newBattlesCompleted);
    
    // Simple timeout to ensure state updates have time to propagate
    setTimeout(() => {
      // Check if we've hit a milestone
      if (milestones.includes(newBattlesCompleted)) {
        generateRankings(newResults);
        setShowingMilestone(true);
        
        toast({
          title: "Milestone Reached!",
          description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
        });
        
        // Reset processing state
        setIsProcessingResult(false);
      } else {
        // Clear selections
        setSelectedPokemon([]);
        
        // Start a new battle
        setTimeout(() => {
          if (!allPokemon || allPokemon.length < 2) {
            toast({
              title: "Error",
              description: "Not enough Pokémon available for battle",
              variant: "destructive"
            });
            setIsProcessingResult(false);
            return;
          }
          
          startNewBattle(allPokemon, battleType);
          
          // Reset processing state
          setTimeout(() => {
            setIsProcessingResult(false);
          }, 300);
        }, 300);
      }
    }, 300);
  }, [
    battleResults, 
    setBattleResults, 
    battlesCompleted, 
    setBattlesCompleted, 
    allPokemon, 
    startNewBattle, 
    setShowingMilestone, 
    milestones, 
    generateRankings, 
    setSelectedPokemon,
    isProcessingResult
  ]);

  return { processBattleResult, isProcessingResult };
};
