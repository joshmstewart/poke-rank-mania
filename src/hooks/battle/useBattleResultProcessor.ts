
import { useCallback, useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

/**
 * Hook for processing battle winners and losers
 */
export const useBattleResultProcessor = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processResult = useCallback((
    selections: number[],
    battleType: BattleType,
    currentBattle: Pokemon[]
  ): SingleBattle[] | null => {
    setIsProcessing(true);

    try {
      if (!currentBattle || currentBattle.length === 0) {
        console.error("No current battle data");
        setIsProcessing(false);
        return null;
      }

      if (!selections || selections.length === 0) {
        console.error("No selections provided");
        setIsProcessing(false);
        return null;
      }

      const newResults: SingleBattle[] = [];

      if (battleType === "pairs") {
        const winner = currentBattle.find(p => p.id === selections[0]);
        const loser = currentBattle.find(p => p.id !== selections[0]);

        if (winner && loser) {
          newResults.push({ winner, loser });
          setBattleResults(prev => [...prev, { winner, loser }]);
          setIsProcessing(false);
          return newResults;
        } else {
          console.error("Invalid selection for pair battle");
          setIsProcessing(false);
          return null;
        }
      } else {
        const winners = currentBattle.filter(p => selections.includes(p.id));
        const losers = currentBattle.filter(p => !selections.includes(p.id));

        if (winners.length > 0 && losers.length > 0) {
          winners.forEach(winner => {
            losers.forEach(loser => {
              newResults.push({ winner, loser });
            });
          });

          setBattleResults(prev => [...prev, ...newResults]);
          setIsProcessing(false);
          return newResults;
        } else {
          console.error("Invalid selection for triplet battle");
          setIsProcessing(false);
          return null;
        }
      }
    } catch (error) {
      console.error("Error processing result:", error);
      setIsProcessing(false);
      return null;
    }
  }, [battleResults, setBattleResults]);

  return {
    processResult,
    isProcessing,
    addResult: processResult
  };
};
