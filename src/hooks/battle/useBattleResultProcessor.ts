
import { useCallback, useRef } from "react";
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

    const newResults = [...battleResults];
    
    if (battleType === "pairs") {
      // For pairs, we know who won and who lost
      const winner = currentBattle.find(p => selections.includes(p.id));
      const loser = currentBattle.find(p => !selections.includes(p.id));
      
      if (winner && loser) {
        console.log(`useBattleResultProcessor: Adding pair result: ${winner.name} beats ${loser.name}`);
        newResults.push({ winner, loser });
        return newResults;
      } else {
        console.error("useBattleResultProcessor: Invalid selection for pair battle", selections, currentBattle);
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
        return newResults;
      } else {
        console.error("useBattleResultProcessor: Invalid selection for triplet battle", selections, currentBattle);
        return null;
      }
    }
  }, [battleResults]);

  return { processResult };
};
