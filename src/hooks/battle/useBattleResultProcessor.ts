
import { useCallback, useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { Rating, rate_1vs1 } from "ts-trueskill";

// Initialize a new Rating for Pokémon without ratings
const getOrCreateRating = (pokemon: Pokemon): Rating => {
  if (!pokemon.rating) {
    pokemon.rating = new Rating(); // Default μ=25, σ≈8.33
  } else if (!(pokemon.rating instanceof Rating)) {
    // Convert from stored format if needed
    pokemon.rating = new Rating(pokemon.rating.mu, pokemon.rating.sigma);
  }
  return pokemon.rating;
};

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
          
          // Apply TrueSkill rating update
          const winnerRating = getOrCreateRating(winner);
          const loserRating = getOrCreateRating(loser);
          
          // Update ratings using TrueSkill
          const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRating, loserRating);
          
          // Store the updated ratings
          winner.rating = newWinnerRating;
          loser.rating = newLoserRating;
          
          console.log(`Updated ratings: ${winner.name} (μ=${newWinnerRating.mu.toFixed(2)}, σ=${newWinnerRating.sigma.toFixed(2)}) | ${loser.name} (μ=${newLoserRating.mu.toFixed(2)}, σ=${newLoserRating.sigma.toFixed(2)})`);
          
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
            const winnerRating = getOrCreateRating(winner);
            
            losers.forEach(loser => {
              const loserRating = getOrCreateRating(loser);
              
              // Update ratings using TrueSkill
              const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRating, loserRating);
              
              // Store the updated ratings
              winner.rating = newWinnerRating;
              loser.rating = newLoserRating;
              
              console.log(`Updated ratings: ${winner.name} (μ=${newWinnerRating.mu.toFixed(2)}, σ=${newWinnerRating.sigma.toFixed(2)}) | ${loser.name} (μ=${newLoserRating.mu.toFixed(2)}, σ=${newLoserRating.sigma.toFixed(2)})`);
              
              newResults.push({ winner, loser });
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
