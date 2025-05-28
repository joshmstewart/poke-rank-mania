
import { useCallback, useState } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
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
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  activeTier?: TopNOption,
  freezePokemonForTier?: (pokemonId: number, tier: TopNOption) => void,
  trackLowerTierLoss?: (pokemonId: number) => void // Add this param to track losses
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
          
          // Find if winner or loser are from different tiers to track upsets
          const winnerRank = battleResults.filter(r => r.winner?.id === winner.id || r.loser?.id === winner.id).length;
          const loserRank = battleResults.filter(r => r.winner?.id === loser.id || r.loser?.id === loser.id).length;
          
          // If winner has a much lower ranking than loser, this is an upset
          // We use this to identify potential demotions
          if (loserRank > winnerRank + 10 && trackLowerTierLoss) {
            console.log(`Upset! Lower-ranked ${winner.name} beat higher-ranked ${loser.name}`);
            trackLowerTierLoss(loser.id);
          }
          
          // Check if the loser should be frozen for the current tier
          // Only freeze if confidence is high enough (low sigma) and the tier is active
          if (activeTier && activeTier !== "All" && freezePokemonForTier) {
            const loserConfidence = 100 * (1 - (newLoserRating.sigma / 8.33));
            const loserScore = newLoserRating.mu - 3 * newLoserRating.sigma;
            
            // Count battles for this pokemon
            const battles = battleResults.filter(
              result => result.winner?.id === loser.id || result.loser?.id === loser.id
            ).length;
            
            // Only freeze if:
            // 1. Pokemon has participated in enough battles
            // 2. Has high enough confidence
            // 3. Has a score significantly below the threshold for this tier
            if (battles >= 5 && loserConfidence > 60 && loserScore < 0) {
              console.log(`Freezing ${loser.name} for Tier ${activeTier} due to low performance`);
              freezePokemonForTier(loser.id, activeTier);
            }
          }
          
          const newResult: SingleBattle = {
            battleType,
            generation: 0, // Default generation
            pokemonIds: currentBattle.map(p => p.id),
            selectedPokemonIds: selections,
            timestamp: new Date().toISOString(),
            winner,
            loser
          };
          
          newResults.push(newResult);
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
              
              // Check freezing criteria for losers in triplet mode
              if (activeTier && activeTier !== "All" && freezePokemonForTier) {
                const loserConfidence = 100 * (1 - (newLoserRating.sigma / 8.33));
                const loserScore = newLoserRating.mu - 3 * newLoserRating.sigma;
                
                // Count battles for this pokemon
                const battles = battleResults.filter(
                  result => result.winner?.id === loser.id || result.loser?.id === loser.id
                ).length;
                
                if (battles >= 5 && loserConfidence > 60 && loserScore < 0) {
                  console.log(`Freezing ${loser.name} for Tier ${activeTier} due to low performance`);
                  freezePokemonForTier(loser.id, activeTier);
                }
              }
              
              const newResult: SingleBattle = {
                battleType,
                generation: 0, // Default generation
                pokemonIds: currentBattle.map(p => p.id),
                selectedPokemonIds: selections,
                timestamp: new Date().toISOString(),
                winner,
                loser
              };
              
              newResults.push(newResult);
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
  }, [battleResults, activeTier, freezePokemonForTier, trackLowerTierLoss]);

  return {
    processResult,
    isProcessing,
    addResult: processResult
  };
};
