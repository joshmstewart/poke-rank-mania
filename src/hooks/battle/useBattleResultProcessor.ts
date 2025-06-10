
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
  const { updateRatings, getRating, getAllRatings, getTotalBattles } = useTrueSkillStore();

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
          
          // Update ratings using the TrueSkill store
          updateRatings([winner.id], [loser.id]);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ Updated ratings for pair battle`);
          
          // ENHANCED: Save battle count for persistence
          const newBattleCount = getTotalBattles();
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
          
          // Update ratings for all winner-loser combinations
          const winnerIds = winners.map(w => w.id);
          const loserIds = losers.map(l => l.id);
          updateRatings(winnerIds, loserIds);
          
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] ✅ Updated ratings for triplet battle`);

          // ENHANCED: Save battle count for triplets too
          const newBattleCount = getTotalBattles();
          saveBattleCount(newBattleCount);
          console.log(`🔥🔥🔥 [BATTLE_RATING_CRITICAL] Saved battle count: ${newBattleCount}`);

          // Create battle result record (for UI display only)
          const newResult: SingleBattle = {
            battleType,
            generation: 0,
            pokemonIds: currentBattle.map(p => p.id),
            selectedPokemonIds: selections,
            timestamp: new Date().toISOString(),
            winner: winners[0], // Just use first winner for display
            loser: losers[0] // Just use first loser for display
          };
          
          newResults.push(newResult);

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
  }, [activeTier, freezePokemonForTier, trackLowerTierLoss, updateRatings, getRating, getAllRatings, getTotalBattles, saveBattleCount]);

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
