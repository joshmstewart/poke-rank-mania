
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
    console.log(`🎯 [NEW_POKEMON_ADDITION] ===== CALCULATING TARGET RATING =====`);
    console.log(`🎯 [NEW_POKEMON_ADDITION] Insertion position: ${insertionPosition}`);
    console.log(`🎯 [NEW_POKEMON_ADDITION] Rankings length: ${rankings.length}`);

    const MIN_SIGMA = 1.0;
    let targetDisplayedScore: number;

    // Get neighbors at the insertion position
    const abovePokemon = insertionPosition > 0 ? rankings[insertionPosition - 1] : null;
    const belowPokemon = insertionPosition < rankings.length ? rankings[insertionPosition] : null;

    console.log(`🎯 [NEW_POKEMON_ADDITION] Above Pokemon: ${abovePokemon?.name || 'None'}`);
    console.log(`🎯 [NEW_POKEMON_ADDITION] Below Pokemon: ${belowPokemon?.name || 'None'}`);

    // Get neighbor scores from TrueSkill store
    let aboveScore = 0, belowScore = 0;
    
    if (abovePokemon) {
      const aboveRating = getRating(abovePokemon.id.toString());
      aboveScore = aboveRating.mu - aboveRating.sigma;
      console.log(`🎯 [NEW_POKEMON_ADDITION] Above score: ${aboveScore.toFixed(5)}`);
    }
    
    if (belowPokemon) {
      const belowRating = getRating(belowPokemon.id.toString());
      belowScore = belowRating.mu - belowRating.sigma;
      console.log(`🎯 [NEW_POKEMON_ADDITION] Below score: ${belowScore.toFixed(5)}`);
    }

    // Calculate target score based on position
    if (abovePokemon && belowPokemon) {
      // Between two Pokemon - use simple average
      targetDisplayedScore = (aboveScore + belowScore) / 2;
      console.log(`🎯 [NEW_POKEMON_ADDITION] BETWEEN: target = ${targetDisplayedScore.toFixed(5)}`);
    } else if (abovePokemon && !belowPokemon) {
      // Bottom position - slightly below the Pokemon above
      targetDisplayedScore = aboveScore - 0.1;
      console.log(`🎯 [NEW_POKEMON_ADDITION] BOTTOM: target = ${targetDisplayedScore.toFixed(5)}`);
    } else if (!abovePokemon && belowPokemon) {
      // Top position - slightly above the Pokemon below
      targetDisplayedScore = belowScore + 0.1;
      console.log(`🎯 [NEW_POKEMON_ADDITION] TOP: target = ${targetDisplayedScore.toFixed(5)}`);
    } else {
      // Single Pokemon in list - use a reasonable default
      targetDisplayedScore = 20.0;
      console.log(`🎯 [NEW_POKEMON_ADDITION] SINGLE: target = ${targetDisplayedScore.toFixed(5)}`);
    }

    // Calculate mu and sigma for the target score
    const newSigma = MIN_SIGMA; // Use minimum sigma for new Pokemon
    const newMu = targetDisplayedScore + newSigma;

    console.log(`🎯 [NEW_POKEMON_ADDITION] Final: μ=${newMu.toFixed(5)}, σ=${newSigma.toFixed(5)}, score=${targetDisplayedScore.toFixed(5)}`);

    return new Rating(newMu, newSigma);
  }, [getRating]);

  const addNewPokemonToRankings = useCallback((
    pokemonId: number,
    insertionPosition: number
  ) => {
    console.log(`🌟 [NEW_POKEMON_ADDITION] ===== ADDING NEW POKEMON =====`);
    console.log(`🌟 [NEW_POKEMON_ADDITION] Pokemon ID: ${pokemonId}`);
    console.log(`🌟 [NEW_POKEMON_ADDITION] Insertion position: ${insertionPosition}`);

    // Get Pokemon data from lookup map
    const pokemonData = pokemonLookupMap.get(pokemonId);
    if (!pokemonData) {
      console.error(`🌟 [NEW_POKEMON_ADDITION] ❌ Pokemon not found in lookup map: ${pokemonId}`);
      return;
    }

    // Calculate target rating for the drop position
    const targetRating = calculateTargetRatingForPosition(insertionPosition, localRankings);
    
    // Update TrueSkill store with calculated rating
    updateRating(pokemonId.toString(), targetRating);
    
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

    console.log(`🌟 [NEW_POKEMON_ADDITION] Created Pokemon: ${newRankedPokemon.name}, Score: ${newRankedPokemon.score.toFixed(5)}`);

    // Insert into rankings at the specified position
    const newRankings = [...localRankings];
    newRankings.splice(insertionPosition, 0, newRankedPokemon);

    console.log(`🌟 [NEW_POKEMON_ADDITION] Inserted at position ${insertionPosition}, new length: ${newRankings.length}`);

    // Update the rankings
    updateLocalRankings(newRankings);

    console.log(`🌟 [NEW_POKEMON_ADDITION] ✅ Addition completed successfully`);
  }, [localRankings, pokemonLookupMap, calculateTargetRatingForPosition, updateRating, updateLocalRankings]);

  return {
    addNewPokemonToRankings
  };
};
