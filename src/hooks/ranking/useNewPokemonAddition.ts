
import { useCallback } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { Rating } from "ts-trueskill";
import { RankedPokemon } from "@/services/pokemon";

export const useNewPokemonAddition = (
  localRankings: any[],
  updateLocalRankings: (rankings: any[]) => void
) => {
  const { updateRating, getRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();

  const calculateTargetRatingForPosition = useCallback((insertionPosition: number, rankings: any[]) => {
    const operationId = `NEW_POKEMON_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎯🎯🎯 [${operationId}] ===== CALCULATING TARGET RATING FOR NEW POKEMON =====`);
    console.log(`🎯🎯🎯 [${operationId}] Insertion position: ${insertionPosition}`);
    console.log(`🎯🎯🎯 [${operationId}] Rankings length: ${rankings.length}`);
    console.log(`🎯🎯🎯 [${operationId}] Rankings array (first 5):`, rankings.slice(0, 5).map((p, i) => `${i}: ${p.name} (${p.score?.toFixed(5) || 'no score'})`));

    const MIN_SIGMA = 1.0;
    let targetDisplayedScore: number;

    // Get neighbors at the insertion position
    const abovePokemon = insertionPosition > 0 ? rankings[insertionPosition - 1] : null;
    const belowPokemon = insertionPosition < rankings.length ? rankings[insertionPosition] : null;

    console.log(`🎯🎯🎯 [${operationId}] NEIGHBORS IDENTIFIED:`);
    console.log(`🎯🎯🎯 [${operationId}] Above Pokemon: ${abovePokemon ? `${abovePokemon.name} (ID: ${abovePokemon.id})` : 'None'}`);
    console.log(`🎯🎯🎯 [${operationId}] Below Pokemon: ${belowPokemon ? `${belowPokemon.name} (ID: ${belowPokemon.id})` : 'None'}`);

    // Get neighbor scores from TrueSkill store
    let aboveScore = 0, belowScore = 0;
    
    if (abovePokemon) {
      const aboveRating = getRating(abovePokemon.id.toString());
      aboveScore = aboveRating.mu - aboveRating.sigma;
      console.log(`🎯🎯🎯 [${operationId}] Above ${abovePokemon.name}: μ=${aboveRating.mu.toFixed(5)}, σ=${aboveRating.sigma.toFixed(5)}, score=${aboveScore.toFixed(5)}`);
    }
    
    if (belowPokemon) {
      const belowRating = getRating(belowPokemon.id.toString());
      belowScore = belowRating.mu - belowRating.sigma;
      console.log(`🎯🎯🎯 [${operationId}] Below ${belowPokemon.name}: μ=${belowRating.mu.toFixed(5)}, σ=${belowRating.sigma.toFixed(5)}, score=${belowScore.toFixed(5)}`);
    }

    // Calculate target score based on position
    if (abovePokemon && belowPokemon) {
      targetDisplayedScore = (aboveScore + belowScore) / 2;
      console.log(`🎯🎯🎯 [${operationId}] BETWEEN CALCULATION: (${aboveScore.toFixed(5)} + ${belowScore.toFixed(5)}) / 2 = ${targetDisplayedScore.toFixed(5)}`);
    } else if (abovePokemon && !belowPokemon) {
      targetDisplayedScore = aboveScore - 0.1;
      console.log(`🎯🎯🎯 [${operationId}] BOTTOM CALCULATION: ${aboveScore.toFixed(5)} - 0.1 = ${targetDisplayedScore.toFixed(5)}`);
    } else if (!abovePokemon && belowPokemon) {
      targetDisplayedScore = belowScore + 0.1;
      console.log(`🎯🎯🎯 [${operationId}] TOP CALCULATION: ${belowScore.toFixed(5)} + 0.1 = ${targetDisplayedScore.toFixed(5)}`);
    } else {
      targetDisplayedScore = 20.0;
      console.log(`🎯🎯🎯 [${operationId}] SINGLE POKEMON: using default 20.0`);
    }

    // Calculate mu and sigma for the target score
    const newSigma = MIN_SIGMA;
    const newMu = targetDisplayedScore + newSigma;

    console.log(`🎯🎯🎯 [${operationId}] FINAL CALCULATION:`);
    console.log(`🎯🎯🎯 [${operationId}] Target score: ${targetDisplayedScore.toFixed(5)}`);
    console.log(`🎯🎯🎯 [${operationId}] New σ: ${newSigma.toFixed(5)}`);
    console.log(`🎯🎯🎯 [${operationId}] New μ: ${newMu.toFixed(5)}`);
    console.log(`🎯🎯🎯 [${operationId}] Verification: μ - σ = ${(newMu - newSigma).toFixed(5)} (should equal ${targetDisplayedScore.toFixed(5)})`);
    console.log(`🎯🎯🎯 [${operationId}] Math check: ${Math.abs((newMu - newSigma) - targetDisplayedScore) < 0.001 ? 'PASS' : 'FAIL'}`);

    const finalRating = new Rating(newMu, newSigma);
    console.log(`🎯🎯🎯 [${operationId}] ===== CALCULATION COMPLETE =====`);
    
    return finalRating;
  }, [getRating]);

  const addNewPokemonToRankings = useCallback((
    pokemonId: number,
    insertionPosition: number
  ) => {
    const operationId = `ADD_POKEMON_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🌟🌟🌟 [${operationId}] ===== ADDING NEW POKEMON TO RANKINGS =====`);
    console.log(`🌟🌟🌟 [${operationId}] Pokemon ID: ${pokemonId}`);
    console.log(`🌟🌟🌟 [${operationId}] Insertion position: ${insertionPosition}`);
    console.log(`🌟🌟🌟 [${operationId}] Current localRankings length: ${localRankings.length}`);

    // Get Pokemon data from lookup map
    const pokemonData = pokemonLookupMap.get(pokemonId);
    if (!pokemonData) {
      console.error(`🌟🌟🌟 [${operationId}] ❌ Pokemon not found in lookup map: ${pokemonId}`);
      return;
    }
    
    console.log(`🌟🌟🌟 [${operationId}] Found Pokemon data: ${pokemonData.name}`);

    // Calculate target rating for the drop position
    console.log(`🌟🌟🌟 [${operationId}] CALLING calculateTargetRatingForPosition...`);
    const targetRating = calculateTargetRatingForPosition(insertionPosition, localRankings);
    console.log(`🌟🌟🌟 [${operationId}] RETURNED from calculateTargetRatingForPosition: μ=${targetRating.mu.toFixed(5)}, σ=${targetRating.sigma.toFixed(5)}`);
    
    // Update TrueSkill store with calculated rating
    console.log(`🌟🌟🌟 [${operationId}] UPDATING TrueSkill store for Pokemon ${pokemonId}...`);
    updateRating(pokemonId.toString(), targetRating);
    
    // Verify the store update immediately
    const verifyRating = getRating(pokemonId.toString());
    const verifyScore = verifyRating.mu - verifyRating.sigma;
    console.log(`🌟🌟🌟 [${operationId}] STORE VERIFICATION: μ=${verifyRating.mu.toFixed(5)}, σ=${verifyRating.sigma.toFixed(5)}, score=${verifyScore.toFixed(5)}`);
    
    // Create the new ranked Pokemon object
    const conservativeEstimate = targetRating.mu - targetRating.sigma;
    const confidence = Math.max(0, Math.min(100, 100 * (1 - (targetRating.sigma / 8.33))));
    
    const newRankedPokemon: RankedPokemon = {
      ...pokemonData,
      score: conservativeEstimate,
      confidence: confidence,
      rating: targetRating,
      count: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    };

    console.log(`🌟🌟🌟 [${operationId}] NEW POKEMON OBJECT CREATED:`);
    console.log(`🌟🌟🌟 [${operationId}] Name: ${newRankedPokemon.name}`);
    console.log(`🌟🌟🌟 [${operationId}] Score: ${newRankedPokemon.score.toFixed(5)}`);
    console.log(`🌟🌟🌟 [${operationId}] Rating: μ=${newRankedPokemon.rating.mu.toFixed(5)}, σ=${newRankedPokemon.rating.sigma.toFixed(5)}`);

    // Insert into rankings at the specified position
    const newRankings = [...localRankings];
    console.log(`🌟🌟🌟 [${operationId}] BEFORE INSERTION - Rankings around position ${insertionPosition}:`);
    for (let i = Math.max(0, insertionPosition - 2); i <= Math.min(localRankings.length - 1, insertionPosition + 2); i++) {
      const p = localRankings[i];
      console.log(`🌟🌟🌟 [${operationId}]   [${i}]: ${p?.name || 'undefined'} (score: ${p?.score?.toFixed(5) || 'no score'})`);
    }
    
    newRankings.splice(insertionPosition, 0, newRankedPokemon);
    
    console.log(`🌟🌟🌟 [${operationId}] AFTER INSERTION - Rankings around position ${insertionPosition}:`);
    for (let i = Math.max(0, insertionPosition - 2); i <= Math.min(newRankings.length - 1, insertionPosition + 2); i++) {
      const p = newRankings[i];
      console.log(`🌟🌟🌟 [${operationId}]   [${i}]: ${p?.name || 'undefined'} (score: ${p?.score?.toFixed(5) || 'no score'})`);
    }

    console.log(`🌟🌟🌟 [${operationId}] CALLING updateLocalRankings with ${newRankings.length} Pokemon...`);
    
    // Update the rankings
    updateLocalRankings(newRankings);

    console.log(`🌟🌟🌟 [${operationId}] ✅ NEW POKEMON ADDITION COMPLETED`);
    
    // Final verification after a delay to catch any async updates
    setTimeout(() => {
      const finalVerifyRating = getRating(pokemonId.toString());
      const finalVerifyScore = finalVerifyRating.mu - finalVerifyRating.sigma;
      console.log(`🌟🌟🌟 [${operationId}] FINAL VERIFICATION (500ms later): μ=${finalVerifyRating.mu.toFixed(5)}, σ=${finalVerifyRating.sigma.toFixed(5)}, score=${finalVerifyScore.toFixed(5)}`);
    }, 500);
    
  }, [localRankings, pokemonLookupMap, calculateTargetRatingForPosition, updateRating, updateLocalRankings, getRating]);

  return {
    addNewPokemonToRankings
  };
};
