
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
  const { updateRating, getRating, hasRating, getAllRatings } = useTrueSkillStore();

  const processResult = useCallback((
    selections: number[],
    battleType: BattleType,
    currentBattle: Pokemon[]
  ): SingleBattle[] | null => {
    setIsProcessing(true);
    console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== STARTING BATTLE RESULT PROCESSING =====`);
    console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Battle type: ${battleType}`);
    console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Selections: ${selections}`);
    console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Current battle: ${currentBattle.map(p => `${p.name}(${p.id})`).join(' vs ')}`);

    // CRITICAL: Check store state BEFORE processing
    const ratingsBeforeProcessing = getAllRatings();
    const ratingCountBefore = Object.keys(ratingsBeforeProcessing).length;
    console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== STORE STATE BEFORE PROCESSING =====`);
    console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Total ratings before: ${ratingCountBefore}`);

    try {
      if (!currentBattle || currentBattle.length === 0) {
        console.error("🔥🔥🔥 [BATTLE_RATING_CRITICAL] No current battle data");
        setIsProcessing(false);
        return null;
      }

      if (!selections || selections.length === 0) {
        console.error("🔥🔥🔥 [BATTLE_RATING_CRITICAL] No selections provided");
        setIsProcessing(false);
        return null;
      }

      const newResults: SingleBattle[] = [];

      if (battleType === "pairs") {
        const winner = currentBattle.find(p => p.id === selections[0]);
        const loser = currentBattle.find(p => p.id !== selections[0]);

        if (winner && loser) {
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== PROCESSING PAIR BATTLE =====`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Winner: ${winner.name} (${winner.id})`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Loser: ${loser.name} (${loser.id})`);
          
          // Get ratings from centralized store ONLY
          const winnerRatingBefore = getRating(winner.id);
          const loserRatingBefore = getRating(loser.id);
          
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== RATINGS BEFORE BATTLE =====`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ${winner.name} BEFORE: μ=${winnerRatingBefore.mu.toFixed(3)}, σ=${winnerRatingBefore.sigma.toFixed(3)}`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ${loser.name} BEFORE: μ=${loserRatingBefore.mu.toFixed(3)}, σ=${loserRatingBefore.sigma.toFixed(3)}`);
          
          // Calculate new ratings using TrueSkill algorithm
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== CALCULATING NEW RATINGS =====`);
          const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRatingBefore, loserRatingBefore);
          
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== RATINGS AFTER CALCULATION =====`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ${winner.name} AFTER: μ=${newWinnerRating.mu.toFixed(3)}, σ=${newWinnerRating.sigma.toFixed(3)}`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ${loser.name} AFTER: μ=${newLoserRating.mu.toFixed(3)}, σ=${newLoserRating.sigma.toFixed(3)}`);
          
          // Store updated ratings in centralized store - CRITICAL POINT
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== UPDATING STORE =====`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Calling updateRating for winner ${winner.name} (${winner.id})`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Winner rating object:`, { mu: newWinnerRating.mu, sigma: newWinnerRating.sigma });
          
          updateRating(winner.id, newWinnerRating);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ Winner rating updated for ${winner.id}`);
          
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Calling updateRating for loser ${loser.name} (${loser.id})`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Loser rating object:`, { mu: newLoserRating.mu, sigma: newLoserRating.sigma });
          
          updateRating(loser.id, newLoserRating);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ Loser rating updated for ${loser.id}`);
          
          // CRITICAL: Verify the ratings were stored immediately after each update
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== VERIFICATION AFTER UPDATES =====`);
          const verifyWinner = getRating(winner.id);
          const verifyLoser = getRating(loser.id);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ${winner.name} VERIFICATION: μ=${verifyWinner.mu.toFixed(3)}, σ=${verifyWinner.sigma.toFixed(3)}`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ${loser.name} VERIFICATION: μ=${verifyLoser.mu.toFixed(3)}, σ=${verifyLoser.sigma.toFixed(3)}`);
          
          // CRITICAL: Check total store state after these updates
          const ratingsAfterUpdate = getAllRatings();
          const ratingCountAfter = Object.keys(ratingsAfterUpdate).length;
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== STORE STATE AFTER UPDATES =====`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Total ratings after: ${ratingCountAfter} (was ${ratingCountBefore})`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Expected increase: 2 (if both Pokemon were new) or 0 (if both already had ratings)`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Store contents:`, Object.keys(ratingsAfterUpdate).map(id => {
            const rating = ratingsAfterUpdate[parseInt(id)];
            return `ID:${id} μ:${rating.mu.toFixed(2)} σ:${rating.sigma.toFixed(2)} battles:${rating.battleCount}`;
          }));
          
          if (ratingCountAfter === ratingCountBefore + 2) {
            console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ PERFECT: Store increased by 2 (both Pokemon were new)`);
          } else if (ratingCountAfter === ratingCountBefore) {
            console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ EXPECTED: Store same size (both Pokemon already had ratings)`);
          } else {
            console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ⚠️ UNEXPECTED: Store count change from ${ratingCountBefore} to ${ratingCountAfter}`);
          }
          
          // ENHANCED: Save battle count for persistence
          const newBattleCount = battleResults.length + 1;
          saveBattleCount(newBattleCount);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Saved battle count: ${newBattleCount}`);
          
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
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ Created battle result record for battle #${newBattleCount}`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== BATTLE PROCESSING COMPLETE =====`);
          setIsProcessing(false);
          return newResults;
        } else {
          console.error("🔥🔥🔥 [BATTLE_RATING_CRITICAL] Invalid selection for pair battle");
          setIsProcessing(false);
          return null;
        }
      } else {
        // For triplets mode - process all winner vs loser combinations
        const winners = currentBattle.filter(p => selections.includes(p.id));
        const losers = currentBattle.filter(p => !selections.includes(p.id));

        if (winners.length > 0 && losers.length > 0) {
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== PROCESSING TRIPLET BATTLE =====`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Winners: ${winners.map(w => `${w.name}(${w.id})`).join(', ')}`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Losers: ${losers.map(l => `${l.name}(${l.id})`).join(', ')}`);
          
          let updateCount = 0;
          winners.forEach(winner => {
            losers.forEach(loser => {
              updateCount++;
              console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Triplet update #${updateCount}: ${winner.name} beats ${loser.name}`);
              
              // Get ratings from centralized store ONLY
              const winnerRating = getRating(winner.id);
              const loserRating = getRating(loser.id);
              
              console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Before: ${winner.name} μ=${winnerRating.mu.toFixed(3)}, ${loser.name} μ=${loserRating.mu.toFixed(3)}`);
              
              // Update ratings using TrueSkill algorithm
              const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRating, loserRating);
              
              console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] After: ${winner.name} μ=${newWinnerRating.mu.toFixed(3)}, ${loser.name} μ=${newLoserRating.mu.toFixed(3)}`);
              
              updateRating(winner.id, newWinnerRating);
              updateRating(loser.id, newLoserRating);
              console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ Updated both ratings for triplet matchup #${updateCount}`);
              
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

          // Check store state after all triplet processing
          const afterTripletRatings = getAllRatings();
          const tripletRatingCount = Object.keys(afterTripletRatings).length;
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== TRIPLET BATTLE COMPLETE =====`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Total ratings after triplet: ${tripletRatingCount} (was ${ratingCountBefore})`);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Processed ${updateCount} individual matchups`);

          // ENHANCED: Save battle count for triplets too
          const newBattleCount = battleResults.length + newResults.length;
          saveBattleCount(newBattleCount);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Saved battle count: ${newBattleCount}`);

          setIsProcessing(false);
          return newResults;
        } else {
          console.error("🔥🔥🔥 [BATTLE_RATING_CRITICAL] Invalid selection for triplet battle");
          setIsProcessing(false);
          return null;
        }
      }
    } catch (error) {
      console.error("🔥🔥🔥 [BATTLE_RATING_CRITICAL] Error processing result:", error);
      setIsProcessing(false);
      return null;
    }
  }, [activeTier, freezePokemonForTier, trackLowerTierLoss, updateRating, getRating, getAllRatings, battleResults.length, saveBattleCount]);

  // CRITICAL: Create a wrapper that ensures battle results are properly saved to the battle results array
  const processBattleAndUpdateResults = useCallback((
    selections: number[],
    battleType: BattleType,
    currentBattle: Pokemon[]
  ) => {
    console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ===== WRAPPER CALLED FOR BATTLE =====`);
    
    const newResults = processResult(selections, battleType, currentBattle);
    
    if (newResults && newResults.length > 0) {
      console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ Adding ${newResults.length} results to battle results array`);
      setBattleResults(prev => {
        const updated = [...prev, ...newResults];
        console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ Battle results array now has ${updated.length} total results`);
        return updated;
      });
      return newResults;
    } else {
      console.error(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ❌ No results to add`);
      return null;
    }
  }, [processResult, setBattleResults]);

  return {
    processResult: processBattleAndUpdateResults,
    isProcessing,
    addResult: processBattleAndUpdateResults
  };
};
