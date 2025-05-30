
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
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== STARTING BATTLE RESULT PROCESSING =====`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Battle type: ${battleType}`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Selections: ${selections}`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Current battle: ${currentBattle.map(p => `${p.name}(${p.id})`).join(' vs ')}`);

    // CRITICAL: Check store state BEFORE processing
    const ratingsBeforeProcessing = getAllRatings();
    const ratingCountBefore = Object.keys(ratingsBeforeProcessing).length;
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== STORE STATE BEFORE PROCESSING =====`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Total ratings before: ${ratingCountBefore}`);
    if (ratingCountBefore > 0) {
      console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Existing ratings:`, Object.keys(ratingsBeforeProcessing).map(id => {
        const rating = ratingsBeforeProcessing[parseInt(id)];
        return `ID:${id} μ:${rating.mu.toFixed(2)} σ:${rating.sigma.toFixed(2)} battles:${rating.battleCount}`;
      }));
    }

    try {
      if (!currentBattle || currentBattle.length === 0) {
        console.error("🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] No current battle data");
        setIsProcessing(false);
        return null;
      }

      if (!selections || selections.length === 0) {
        console.error("🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] No selections provided");
        setIsProcessing(false);
        return null;
      }

      const newResults: SingleBattle[] = [];

      if (battleType === "pairs") {
        const winner = currentBattle.find(p => p.id === selections[0]);
        const loser = currentBattle.find(p => p.id !== selections[0]);

        if (winner && loser) {
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== PROCESSING PAIR BATTLE =====`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Winner: ${winner.name} (${winner.id})`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Loser: ${loser.name} (${loser.id})`);
          
          // Get ratings from centralized store ONLY
          const winnerRatingBefore = getRating(winner.id);
          const loserRatingBefore = getRating(loser.id);
          
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== RATINGS BEFORE BATTLE =====`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ${winner.name} BEFORE: μ=${winnerRatingBefore.mu.toFixed(3)}, σ=${winnerRatingBefore.sigma.toFixed(3)}`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ${loser.name} BEFORE: μ=${loserRatingBefore.mu.toFixed(3)}, σ=${loserRatingBefore.sigma.toFixed(3)}`);
          
          // Calculate new ratings using TrueSkill algorithm
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== CALCULATING NEW RATINGS =====`);
          const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRatingBefore, loserRatingBefore);
          
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== RATINGS AFTER CALCULATION =====`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ${winner.name} AFTER: μ=${newWinnerRating.mu.toFixed(3)}, σ=${newWinnerRating.sigma.toFixed(3)}`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ${loser.name} AFTER: μ=${newLoserRating.mu.toFixed(3)}, σ=${newLoserRating.sigma.toFixed(3)}`);
          
          // Store updated ratings in centralized store - CRITICAL POINT
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== UPDATING STORE =====`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Calling updateRating for winner ${winner.name} (${winner.id})`);
          updateRating(winner.id, newWinnerRating);
          
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Calling updateRating for loser ${loser.name} (${loser.id})`);
          updateRating(loser.id, newLoserRating);
          
          // CRITICAL: Verify the ratings were stored immediately after each update
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== VERIFICATION AFTER UPDATES =====`);
          const verifyWinner = getRating(winner.id);
          const verifyLoser = getRating(loser.id);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ${winner.name} VERIFICATION: μ=${verifyWinner.mu.toFixed(3)}, σ=${verifyWinner.sigma.toFixed(3)}`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ${loser.name} VERIFICATION: μ=${verifyLoser.mu.toFixed(3)}, σ=${verifyLoser.sigma.toFixed(3)}`);
          
          // CRITICAL: Check total store state after these updates
          const ratingsAfterUpdate = getAllRatings();
          const ratingCountAfter = Object.keys(ratingsAfterUpdate).length;
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== STORE STATE AFTER UPDATES =====`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Total ratings after: ${ratingCountAfter} (was ${ratingCountBefore})`);
          
          if (ratingCountAfter !== ratingCountBefore && ratingCountBefore > 0) {
            console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ⚠️ RATING COUNT CHANGED! This might indicate data loss!`);
            console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Ratings that disappeared:`, Object.keys(ratingsBeforeProcessing).filter(id => !ratingsAfterUpdate[parseInt(id)]));
          }
          
          // Log all current ratings for debugging
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] All ratings after this battle:`, Object.keys(ratingsAfterUpdate).map(id => {
            const rating = ratingsAfterUpdate[parseInt(id)];
            return `ID:${id} μ:${rating.mu.toFixed(2)} σ:${rating.sigma.toFixed(2)} battles:${rating.battleCount}`;
          }));
          
          // Handle tier-specific logic using centralized ratings
          if (activeTier && activeTier !== "All" && freezePokemonForTier) {
            const loserConfidence = 100 * (1 - (newLoserRating.sigma / 8.33));
            const loserScore = newLoserRating.mu - 3 * newLoserRating.sigma;
            
            // Count battles using centralized store data
            const battleCount = useTrueSkillStore.getState().ratings[loser.id]?.battleCount || 0;
            
            if (battleCount >= 5 && loserConfidence > 60 && loserScore < 0) {
              console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Freezing ${loser.name} for Tier ${activeTier} (confidence: ${loserConfidence.toFixed(1)}%, score: ${loserScore.toFixed(2)})`);
              freezePokemonForTier(loser.id, activeTier);
            }
          }
          
          // ENHANCED: Save battle count for persistence
          const newBattleCount = battleResults.length + 1;
          saveBattleCount(newBattleCount);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Saved battle count: ${newBattleCount}`);
          
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
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ✅ Created battle result record for battle #${newBattleCount}`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== BATTLE PROCESSING COMPLETE =====`);
          setIsProcessing(false);
          return newResults;
        } else {
          console.error("🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Invalid selection for pair battle");
          setIsProcessing(false);
          return null;
        }
      } else {
        // For triplets mode - process all winner vs loser combinations
        const winners = currentBattle.filter(p => selections.includes(p.id));
        const losers = currentBattle.filter(p => !selections.includes(p.id));

        if (winners.length > 0 && losers.length > 0) {
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== PROCESSING TRIPLET BATTLE =====`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Winners: ${winners.map(w => `${w.name}(${w.id})`).join(', ')}`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Losers: ${losers.map(l => `${l.name}(${l.id})`).join(', ')}`);
          
          let updateCount = 0;
          winners.forEach(winner => {
            losers.forEach(loser => {
              updateCount++;
              console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Triplet update #${updateCount}: ${winner.name} beats ${loser.name}`);
              
              // Get ratings from centralized store ONLY
              const winnerRating = getRating(winner.id);
              const loserRating = getRating(loser.id);
              
              console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Before: ${winner.name} μ=${winnerRating.mu.toFixed(3)}, ${loser.name} μ=${loserRating.mu.toFixed(3)}`);
              
              // Update ratings using TrueSkill algorithm
              const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRating, loserRating);
              
              console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] After: ${winner.name} μ=${newWinnerRating.mu.toFixed(3)}, ${loser.name} μ=${newLoserRating.mu.toFixed(3)}`);
              
              updateRating(winner.id, newWinnerRating);
              updateRating(loser.id, newLoserRating);
              
              // Handle tier-specific logic using centralized ratings
              if (activeTier && activeTier !== "All" && freezePokemonForTier) {
                const loserConfidence = 100 * (1 - (newLoserRating.sigma / 8.33));
                const loserScore = newLoserRating.mu - 3 * newLoserRating.sigma;
                
                // Count battles using centralized store data
                const battleCount = useTrueSkillStore.getState().ratings[loser.id]?.battleCount || 0;
                
                if (battleCount >= 5 && loserConfidence > 60 && loserScore < 0) {
                  console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Freezing ${loser.name} for Tier ${activeTier}`);
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

          // Check store state after all triplet processing
          const afterTripletRatings = getAllRatings();
          const tripletRatingCount = Object.keys(afterTripletRatings).length;
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== TRIPLET BATTLE COMPLETE =====`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Total ratings after triplet: ${tripletRatingCount} (was ${ratingCountBefore})`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Processed ${updateCount} individual matchups`);

          // ENHANCED: Save battle count for triplets too
          const newBattleCount = battleResults.length + newResults.length;
          saveBattleCount(newBattleCount);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Saved battle count: ${newBattleCount}`);

          setIsProcessing(false);
          return newResults;
        } else {
          console.error("🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Invalid selection for triplet battle");
          setIsProcessing(false);
          return null;
        }
      }
    } catch (error) {
      console.error("🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] Error processing result:", error);
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
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ===== WRAPPER CALLED FOR BATTLE =====`);
    
    const newResults = processResult(selections, battleType, currentBattle);
    
    if (newResults && newResults.length > 0) {
      console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ✅ Adding ${newResults.length} results to battle results array`);
      setBattleResults(prev => {
        const updated = [...prev, ...newResults];
        console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ✅ Battle results array now has ${updated.length} total results`);
        return updated;
      });
      return newResults;
    } else {
      console.error(`🚨🚨🚨 [BATTLE_PROCESSOR_DETAILED] ❌ No results to add`);
      return null;
    }
  }, [processResult, setBattleResults]);

  return {
    processResult: processBattleAndUpdateResults,
    isProcessing,
    addResult: processBattleAndUpdateResults
  };
};
