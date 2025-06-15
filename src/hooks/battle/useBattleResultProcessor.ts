
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
  const { processBattleOutcomes, getRating, getAllRatings, incrementTotalBattles } = useTrueSkillStore();

  const processResult = useCallback((
    selections: number[],
    battleType: BattleType,
    currentBattle: Pokemon[]
  ): SingleBattle[] | null => {
    setIsProcessing(true);
    console.log(`[BATTLE_PROCESSOR] Processing ${battleType} battle for ${currentBattle.map(p => p.name).join(' vs ')}`);

    try {
      if (!currentBattle || currentBattle.length === 0) {
        console.error("[BATTLE_PROCESSOR] No current battle data");
        setIsProcessing(false);
        return null;
      }

      if (!selections || selections.length === 0) {
        console.error("[BATTLE_PROCESSOR] No selections provided");
        setIsProcessing(false);
        return null;
      }

      const newResults: SingleBattle[] = [];

      if (battleType === "pairs") {
        const winner = currentBattle.find(p => p.id === selections[0]);
        const loser = currentBattle.find(p => p.id !== selections[0]);

        if (winner && loser) {
          console.log(`[BATTLE_PROCESSOR] Winner: ${winner.name}, Loser: ${loser.name}`);
          
          const winnerRatingBefore = getRating(winner.id.toString());
          const loserRatingBefore = getRating(loser.id.toString());
          
          const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRatingBefore, loserRatingBefore);
          
          // ATOMIC UPDATE: Process ratings and battle counts in one operation
          processBattleOutcomes([
            { pokemonId: winner.id.toString(), newRating: newWinnerRating },
            { pokemonId: loser.id.toString(), newRating: newLoserRating },
          ]);

          // Increment total battles, which also triggers cloud sync
          incrementTotalBattles();
          
          const totalBattlesAfter = useTrueSkillStore.getState().totalBattles;
          console.log(`[BATTLE_PROCESSOR] Battle #${totalBattlesAfter} complete.`);
          
          // ENHANCED: Save battle count for persistence
          saveBattleCount(totalBattlesAfter);
          
          // Create battle result record for UI display
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
          console.error("[BATTLE_PROCESSOR] Invalid selection for pair battle");
          setIsProcessing(false);
          return null;
        }
      } else {
        // For triplets mode - process all winner vs loser combinations
        const winners = currentBattle.filter(p => selections.includes(p.id));
        const losers = currentBattle.filter(p => !selections.includes(p.id));

        if (winners.length > 0 && losers.length > 0) {
          console.log(`[BATTLE_PROCESSOR] Triplet Winners: ${winners.map(w => w.name).join(', ')}`);
          console.log(`[BATTLE_PROCESSOR] Triplet Losers: ${losers.map(l => l.name).join(', ')}`);
          
          // Calculate final ratings after all matchups
          const finalPokemonRatings: Record<string, Rating> = {};
          currentBattle.forEach(p => {
            finalPokemonRatings[p.id.toString()] = getRating(p.id.toString());
          });
          
          winners.forEach(winner => {
            losers.forEach(loser => {
              const [newWinnerRating, newLoserRating] = rate_1vs1(
                finalPokemonRatings[winner.id.toString()],
                finalPokemonRatings[loser.id.toString()]
              );
              finalPokemonRatings[winner.id.toString()] = newWinnerRating;
              finalPokemonRatings[loser.id.toString()] = newLoserRating;
              
              // Create a result for each individual matchup for the log
              const newResult: SingleBattle = {
                battleType,
                generation: 0,
                pokemonIds: [winner.id, loser.id],
                selectedPokemonIds: [winner.id],
                timestamp: new Date().toISOString(),
                winner,
                loser
              };
              newResults.push(newResult);
            });
          });

          const ratingUpdates = currentBattle.map(p => ({
            pokemonId: p.id.toString(),
            newRating: finalPokemonRatings[p.id.toString()]
          }));

          // ATOMIC UPDATE: Process all ratings and battle counts in one operation
          processBattleOutcomes(ratingUpdates);

          // Increment total battles, which also triggers cloud sync
          incrementTotalBattles();
          
          const totalBattlesAfterTriplet = useTrueSkillStore.getState().totalBattles;
          console.log(`[BATTLE_PROCESSOR] Triplet battle #${totalBattlesAfterTriplet} complete.`);

          // ENHANCED: Save battle count for triplets too
          saveBattleCount(totalBattlesAfterTriplet);

          setIsProcessing(false);
          return newResults;
        } else {
          console.error("[BATTLE_PROCESSOR] Invalid selection for triplet battle");
          setIsProcessing(false);
          return null;
        }
      }
    } catch (error) {
      console.error("[BATTLE_PROCESSOR] Error processing result:", error);
      setIsProcessing(false);
      return null;
    }
  }, [activeTier, freezePokemonForTier, trackLowerTierLoss, processBattleOutcomes, getRating, getAllRatings, incrementTotalBattles, saveBattleCount]);

  // CRITICAL: Create a wrapper that ensures battle results are properly saved to the battle results array
  const processBattleAndUpdateResults = useCallback((
    selections: number[],
    battleType: BattleType,
    currentBattle: Pokemon[]
  ) => {
    console.log(`[BATTLE_PROCESSOR] Wrapper called for battle result processing.`);
    
    const newResults = processResult(selections, battleType, currentBattle);
    
    if (newResults && newResults.length > 0) {
      console.log(`[BATTLE_PROCESSOR] Adding ${newResults.length} result(s) to battle results array`);
      setBattleResults(prev => {
        const updated = [...prev, ...newResults];
        console.log(`[BATTLE_PROCESSOR] Battle results array now has ${updated.length} total results`);
        return updated;
      });
      return newResults;
    } else {
      console.error(`[BATTLE_PROCESSOR] No results to add`);
      return null;
    }
  }, [processResult, setBattleResults]);

  return {
    processResult: processBattleAndUpdateResults,
    isProcessing,
    addResult: processBattleAndUpdateResults
  };
};
