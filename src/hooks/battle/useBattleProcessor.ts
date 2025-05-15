
import { useState, useRef } from "react";
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
  // Track if processing is happening
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  // Use a ref to track the last completed battle count
  const lastBattleCountRef = useRef(battlesCompleted);
  // Track if a new battle has been started already
  const hasStartedNewBattleRef = useRef(false);

  const processBattleResult = (selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
    // Prevent double processing
    if (isProcessingResult) {
      console.log("processBattleResult: Already processing a battle result, ignoring");
      return;
    }
    
    console.log("processBattleResult: Processing battle result with selections:", selections);
    console.log("processBattleResult: Current battle:", currentBattle.map(p => p.name));
    setIsProcessingResult(true);
    hasStartedNewBattleRef.current = false;
    
    if (!currentBattle || currentBattle.length === 0) {
      console.error("processBattleResult: No current battle data available");
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
        console.log(`processBattleResult: Adding pair result: ${winner.name} beats ${loser.name}`);
        newResults.push({ winner, loser });
      } else {
        console.error("processBattleResult: Invalid selection for pair battle", selections, currentBattle);
        setIsProcessingResult(false);
        return; // Don't continue if we can't determine winner/loser
      }
    } else {
      // For triplets/trios, each selected is considered a "winner" against each unselected
      const winners = currentBattle.filter(p => selections.includes(p.id));
      const losers = currentBattle.filter(p => !selections.includes(p.id));
      
      // Only add results if there are winners AND losers
      if (winners.length > 0 && losers.length > 0) {
        console.log(`processBattleResult: Adding ${winners.length} winners against ${losers.length} losers`);
        winners.forEach(winner => {
          losers.forEach(loser => {
            console.log(`processBattleResult: - ${winner.name} beats ${loser.name}`);
            newResults.push({ winner, loser });
          });
        });
      } else {
        console.error("processBattleResult: Invalid selection for triplet battle", selections, currentBattle);
        setIsProcessingResult(false);
        return; // Don't continue if we can't determine winners/losers
      }
    }
    
    // Important: Update battle results
    setBattleResults(newResults);
    
    // CRITICAL: Increment the battles completed counter
    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`processBattleResult: Incrementing battles completed from ${battlesCompleted} to ${newBattlesCompleted}`);
    lastBattleCountRef.current = newBattlesCompleted; 
    setBattlesCompleted(newBattlesCompleted);
    
    // Check if we've hit a milestone
    if (milestones.includes(newBattlesCompleted)) {
      console.log(`processBattleResult: Milestone reached at ${newBattlesCompleted} battles!`);
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
      // Clear selections before starting a new battle
      setSelectedPokemon([]);
      
      // Start a new battle with a slight delay to ensure state updates
      // Use staggered timeouts to ensure proper state flow
      setTimeout(() => {
        // Validate allPokemon before starting a new battle
        if (!allPokemon || allPokemon.length < 2) {
          console.error("processBattleResult: Not enough Pokémon available for battle:", allPokemon?.length || 0);
          toast({
            title: "Error",
            description: "Not enough Pokémon available for battle",
            variant: "destructive"
          });
          setIsProcessingResult(false);
          return;
        }
        
        if (!hasStartedNewBattleRef.current) {
          console.log(`processBattleResult: Starting new battle after completing battle #${newBattlesCompleted}`);
          hasStartedNewBattleRef.current = true;
          
          // Start a new battle
          startNewBattle(allPokemon, battleType);
          
          // Reset processing state after the new battle has started
          setTimeout(() => {
            setIsProcessingResult(false);
          }, 500);
        } else {
          console.log("processBattleResult: New battle already started, skipping");
          setIsProcessingResult(false);
        }
      }, 500);
    }
  };

  return { processBattleResult, isProcessingResult };
};
