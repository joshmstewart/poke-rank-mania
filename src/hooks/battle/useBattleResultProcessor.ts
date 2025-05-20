
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
          console.log(`Processing pair battle result: ${winner.name} beats ${loser.name}`);
          newResults.push({ winner, loser });
          setIsProcessing(false);
          return newResults;
        } else {
          console.error("Invalid selection for pair battle");
          setIsProcessing(false);
          return null;
        }
      } else {
        // For triplets mode
        const winners = currentBattle.filter(p => selections.includes(p.id));
        const losers = currentBattle.filter(p => !selections.includes(p.id));

        if (winners.length > 0 && losers.length > 0) {
          console.log(`Processing triplet battle with ${winners.length} winners and ${losers.length} losers`);
          winners.forEach(winner => {
            losers.forEach(loser => {
              newResults.push({ winner, loser });
              console.log(`- ${winner.name} beats ${loser.name}`);
            });
          });

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
  }, []);

  return {
    processResult,
    isProcessing,
    addResult: processResult
  };
};
