
import { useCallback, useState } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { Rating, rate_1vs1 } from "ts-trueskill";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useBattleStatePersistence } from "@/hooks/useBattleStatePersistence";

/**
 * Hook for processing battle winners and losers
 * Now fully integrated with centralized TrueSkill store and battle persistence
 */
export const useBattleResultProcessor = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  activeTier?: TopNOption,
  freezePokemonForTier?: (pokemonId: number, tier: TopNOption) => void,
  trackLowerTierLoss?: (pokemonId: number) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { saveBattleCount } = useBattleStatePersistence();
  
  // Get the centralized TrueSkill store functions - SINGLE SOURCE OF TRUTH
  const { updateRating, getRating, hasRating } = useTrueSkillStore();

  const processResult = useCallback((
    selections: number[],
    battleType: BattleType,
    currentBattle: Pokemon[]
  ): SingleBattle[] | null => {
    setIsProcessing(true);
    console.log(`[CENTRALIZED_TRUESKILL] Processing battle result through centralized store`);

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
          console.log(`[CENTRALIZED_TRUESKILL] Processing pair: ${winner.name} beats ${loser.name}`);
          
          // Get ratings from centralized store ONLY
          const winnerRating = getRating(winner.id);
          const loserRating = getRating(loser.id);
          
          console.log(`[CENTRALIZED_TRUESKILL] Before battle - ${winner.name}: μ=${winnerRating.mu.toFixed(2)}, σ=${winnerRating.sigma.toFixed(2)}`);
          console.log(`[CENTRALIZED_TRUESKILL] Before battle - ${loser.name}: μ=${loserRating.mu.toFixed(2)}, σ=${loserRating.sigma.toFixed(2)}`);
          
          // Update ratings using TrueSkill algorithm
          const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRating, loserRating);
          
          // Store updated ratings in centralized store - SINGLE SOURCE OF TRUTH
          updateRating(winner.id, newWinnerRating);
          updateRating(loser.id, newLoserRating);
          
          console.log(`[CENTRALIZED_TRUESKILL] After battle - ${winner.name}: μ=${newWinnerRating.mu.toFixed(2)}, σ=${newWinnerRating.sigma.toFixed(2)}`);
          console.log(`[CENTRALIZED_TRUESKILL] After battle - ${loser.name}: μ=${newLoserRating.mu.toFixed(2)}, σ=${newLoserRating.sigma.toFixed(2)}`);
          
          // ENHANCED: Save battle count for persistence
          const newBattleCount = battleResults.length + 1;
          saveBattleCount(newBattleCount);
          console.log(`[CENTRALIZED_TRUESKILL] Saved battle count: ${newBattleCount}`);
          
          // Handle tier-specific logic using centralized ratings
          if (activeTier && activeTier !== "All" && freezePokemonForTier) {
            const loserConfidence = 100 * (1 - (newLoserRating.sigma / 8.33));
            const loserScore = newLoserRating.mu - 3 * newLoserRating.sigma;
            
            // Count battles using centralized store data
            const battleCount = useTrueSkillStore.getState().ratings[loser.id]?.battleCount || 0;
            
            if (battleCount >= 5 && loserConfidence > 60 && loserScore < 0) {
              console.log(`[CENTRALIZED_TRUESKILL] Freezing ${loser.name} for Tier ${activeTier} (confidence: ${loserConfidence.toFixed(1)}%, score: ${loserScore.toFixed(2)})`);
              freezePokemonForTier(loser.id, activeTier);
            }
          }
          
          // Create battle result record (for UI display only, not for ratings)
          const newResult: SingleBattle = {
            battleType,
            generation: 0,
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
        // For triplets mode - process all winner vs loser combinations
        const winners = currentBattle.filter(p => selections.includes(p.id));
        const losers = currentBattle.filter(p => !selections.includes(p.id));

        if (winners.length > 0 && losers.length > 0) {
          console.log(`[CENTRALIZED_TRUESKILL] Processing triplet: ${winners.length} winners vs ${losers.length} losers`);
          
          winners.forEach(winner => {
            losers.forEach(loser => {
              // Get ratings from centralized store ONLY
              const winnerRating = getRating(winner.id);
              const loserRating = getRating(loser.id);
              
              // Update ratings using TrueSkill algorithm
              const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRating, loserRating);
              
              // Store updated ratings in centralized store - SINGLE SOURCE OF TRUTH
              updateRating(winner.id, newWinnerRating);
              updateRating(loser.id, newLoserRating);
              
              console.log(`[CENTRALIZED_TRUESKILL] Triplet update - ${winner.name}: μ=${newWinnerRating.mu.toFixed(2)}, ${loser.name}: μ=${newLoserRating.mu.toFixed(2)}`);
              
              // Handle tier-specific logic using centralized ratings
              if (activeTier && activeTier !== "All" && freezePokemonForTier) {
                const loserConfidence = 100 * (1 - (newLoserRating.sigma / 8.33));
                const loserScore = newLoserRating.mu - 3 * newLoserRating.sigma;
                
                // Count battles using centralized store data
                const battleCount = useTrueSkillStore.getState().ratings[loser.id]?.battleCount || 0;
                
                if (battleCount >= 5 && loserConfidence > 60 && loserScore < 0) {
                  console.log(`[CENTRALIZED_TRUESKILL] Freezing ${loser.name} for Tier ${activeTier}`);
                  freezePokemonForTier(loser.id, activeTier);
                }
              }
              
              // Create battle result record (for UI display only)
              const newResult: SingleBattle = {
                battleType,
                generation: 0,
                pokemonIds: currentBattle.map(p => p.id),
                selectedPokemonIds: selections,
                timestamp: new Date().toISOString(),
                winner,
                loser
              };
              
              newResults.push(newResult);
            });
          });

          // ENHANCED: Save battle count for triplets too
          const newBattleCount = battleResults.length + newResults.length;
          saveBattleCount(newBattleCount);
          console.log(`[CENTRALIZED_TRUESKILL] Saved battle count: ${newBattleCount}`);

          setIsProcessing(false);
          return newResults;
        } else {
          console.error("Invalid selection for triplet battle");
          setIsProcessing(false);
          return null;
        }
      }
    } catch (error) {
      console.error("[CENTRALIZED_TRUESKILL] Error processing result:", error);
      setIsProcessing(false);
      return null;
    }
  }, [activeTier, freezePokemonForTier, trackLowerTierLoss, updateRating, getRating, battleResults.length, saveBattleCount]);

  return {
    processResult,
    isProcessing,
    addResult: processResult
  };
};
