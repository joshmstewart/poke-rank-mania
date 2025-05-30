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
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ===== PROCESSING BATTLE RESULT =====`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Battle type: ${battleType}`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Selections: ${selections}`);
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Current battle: ${currentBattle.map(p => p.name)}`);

    // Check current store state before processing
    const currentRatings = getAllRatings();
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Store has ${Object.keys(currentRatings).length} ratings before processing`);

    try {
      if (!currentBattle || currentBattle.length === 0) {
        console.error("🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] No current battle data");
        setIsProcessing(false);
        return null;
      }

      if (!selections || selections.length === 0) {
        console.error("🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] No selections provided");
        setIsProcessing(false);
        return null;
      }

      const newResults: SingleBattle[] = [];

      if (battleType === "pairs") {
        const winner = currentBattle.find(p => p.id === selections[0]);
        const loser = currentBattle.find(p => p.id !== selections[0]);

        if (winner && loser) {
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Processing pair: ${winner.name} (${winner.id}) beats ${loser.name} (${loser.id})`);
          
          // Get ratings from centralized store ONLY
          const winnerRating = getRating(winner.id);
          const loserRating = getRating(loser.id);
          
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Before battle - ${winner.name}: μ=${winnerRating.mu.toFixed(2)}, σ=${winnerRating.sigma.toFixed(2)}`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Before battle - ${loser.name}: μ=${loserRating.mu.toFixed(2)}, σ=${loserRating.sigma.toFixed(2)}`);
          
          // Update ratings using TrueSkill algorithm
          const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRating, loserRating);
          
          // Store updated ratings in centralized store - SINGLE SOURCE OF TRUTH
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Updating ratings in centralized store:`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Winner ${winner.name} (${winner.id}): μ=${newWinnerRating.mu.toFixed(2)}, σ=${newWinnerRating.sigma.toFixed(2)}`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Loser ${loser.name} (${loser.id}): μ=${newLoserRating.mu.toFixed(2)}, σ=${newLoserRating.sigma.toFixed(2)}`);
          
          updateRating(winner.id, newWinnerRating);
          updateRating(loser.id, newLoserRating);
          
          // Verify the ratings were stored
          const verifyWinner = getRating(winner.id);
          const verifyLoser = getRating(loser.id);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ VERIFICATION - ${winner.name}: μ=${verifyWinner.mu.toFixed(2)}, σ=${verifyWinner.sigma.toFixed(2)}`);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ VERIFICATION - ${loser.name}: μ=${verifyLoser.mu.toFixed(2)}, σ=${verifyLoser.sigma.toFixed(2)}`);
          
          // Check store state after processing
          const afterRatings = getAllRatings();
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Store now has ${Object.keys(afterRatings).length} ratings after processing`);
          
          // ENHANCED: Save battle count for persistence
          const newBattleCount = battleResults.length + 1;
          saveBattleCount(newBattleCount);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Saved battle count: ${newBattleCount}`);
          
          // Handle tier-specific logic using centralized ratings
          if (activeTier && activeTier !== "All" && freezePokemonForTier) {
            const loserConfidence = 100 * (1 - (newLoserRating.sigma / 8.33));
            const loserScore = newLoserRating.mu - 3 * newLoserRating.sigma;
            
            // Count battles using centralized store data
            const battleCount = useTrueSkillStore.getState().ratings[loser.id]?.battleCount || 0;
            
            if (battleCount >= 5 && loserConfidence > 60 && loserScore < 0) {
              console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Freezing ${loser.name} for Tier ${activeTier} (confidence: ${loserConfidence.toFixed(1)}%, score: ${loserScore.toFixed(2)})`);
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
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Created battle result record`);
          setIsProcessing(false);
          return newResults;
        } else {
          console.error("🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Invalid selection for pair battle");
          setIsProcessing(false);
          return null;
        }
      } else {
        // For triplets mode - process all winner vs loser combinations
        const winners = currentBattle.filter(p => selections.includes(p.id));
        const losers = currentBattle.filter(p => !selections.includes(p.id));

        if (winners.length > 0 && losers.length > 0) {
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Processing triplet: ${winners.length} winners vs ${losers.length} losers`);
          
          winners.forEach(winner => {
            losers.forEach(loser => {
              // Get ratings from centralized store ONLY
              const winnerRating = getRating(winner.id);
              const loserRating = getRating(loser.id);
              
              // Update ratings using TrueSkill algorithm
              const [newWinnerRating, newLoserRating] = rate_1vs1(winnerRating, loserRating);
              
              // Store updated ratings in centralized store - SINGLE SOURCE OF TRUTH
              console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Triplet update - ${winner.name} (${winner.id}): μ=${newWinnerRating.mu.toFixed(2)}, ${loser.name} (${loser.id}): μ=${newLoserRating.mu.toFixed(2)}`);
              updateRating(winner.id, newWinnerRating);
              updateRating(loser.id, newLoserRating);
              
              // Handle tier-specific logic using centralized ratings
              if (activeTier && activeTier !== "All" && freezePokemonForTier) {
                const loserConfidence = 100 * (1 - (newLoserRating.sigma / 8.33));
                const loserScore = newLoserRating.mu - 3 * newLoserRating.sigma;
                
                // Count battles using centralized store data
                const battleCount = useTrueSkillStore.getState().ratings[loser.id]?.battleCount || 0;
                
                if (battleCount >= 5 && loserConfidence > 60 && loserScore < 0) {
                  console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Freezing ${loser.name} for Tier ${activeTier}`);
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
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Store now has ${Object.keys(afterTripletRatings).length} ratings after triplet processing`);

          // ENHANCED: Save battle count for triplets too
          const newBattleCount = battleResults.length + newResults.length;
          saveBattleCount(newBattleCount);
          console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Saved battle count: ${newBattleCount}`);

          setIsProcessing(false);
          return newResults;
        } else {
          console.error("🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Invalid selection for triplet battle");
          setIsProcessing(false);
          return null;
        }
      }
    } catch (error) {
      console.error("🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] Error processing result:", error);
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
    console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ===== WRAPPER CALLED =====`);
    
    const newResults = processResult(selections, battleType, currentBattle);
    
    if (newResults && newResults.length > 0) {
      console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Adding ${newResults.length} results to battle results array`);
      setBattleResults(prev => {
        const updated = [...prev, ...newResults];
        console.log(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ✅ Battle results array now has ${updated.length} total results`);
        return updated;
      });
      return newResults;
    } else {
      console.error(`🚨🚨🚨 [BATTLE_PROCESSOR_CRITICAL] ❌ No results to add`);
      return null;
    }
  }, [processResult, setBattleResults]);

  return {
    processResult: processBattleAndUpdateResults,
    isProcessing,
    addResult: processBattleAndUpdateResults
  };
};
