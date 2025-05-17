
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";

/**
 * Hook for processing battle winners and losers
 */
export const useBattleResultProcessor = (
  battleResults: BattleResult,
  setBattleResults: React.Dispatch<React.SetStateAction<BattleResult>>
) => {
  // Process the current battle and determine winners and losers
  const processResult = useCallback((selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
    if (!currentBattle || currentBattle.length === 0) {
      console.error("useBattleResultProcessor: No current battle data available");
      return null;
    }

    if (!selections || selections.length === 0) {
      console.error("useBattleResultProcessor: No selections provided");
      return null;
    }

    console.log("useBattleResultProcessor: Processing with selections:", selections);
    console.log("useBattleResultProcessor: Current battle Pokémon:", currentBattle.map(p => p.name));
    
    // Create a new array instead of mutating the existing one
    const newResults = [...battleResults];
    
    if (battleType === "pairs") {
      // For pairs, we know who won and who lost
      const winner = currentBattle.find(p => p.id === selections[0]);
      const loser = currentBattle.find(p => p.id !== selections[0]);
      
      if (winner && loser) {
        console.log(`useBattleResultProcessor: Adding pair result: ${winner.name} beats ${loser.name}`);
        // Add new result to array
        newResults.push({ winner, loser });
        // Update state with new array
        setBattleResults(newResults);
        return newResults;
      } else {
        console.error("useBattleResultProcessor: Invalid selection for pair battle", 
          { selections, winner: winner?.name, loser: loser?.name });
        return null;
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
        // Update state with new array
        setBattleResults(newResults);
        return newResults;
      } else {
        console.error("useBattleResultProcessor: Invalid selection for triplet battle", selections, currentBattle);
        return null;
      }
    }
  }, [battleResults, setBattleResults]);

  return { 
    processResult,
    // Add this alias to fix the build error
    addResult: processResult 
  };
};
