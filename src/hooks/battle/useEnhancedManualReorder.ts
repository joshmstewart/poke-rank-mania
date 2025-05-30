
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { Rating, rate_1vs1 } from "ts-trueskill";
import { toast } from "sonner";
import { usePokemonContext } from "@/contexts/PokemonContext";

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void
) => {
  const { pokemonLookupMap } = usePokemonContext();

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    console.log(`🔧 [ENHANCED_REORDER] Starting enhanced manual reorder for Pokemon ${draggedPokemonId}`);
    console.log(`🔧 [ENHANCED_REORDER] Moving from index ${sourceIndex} to ${destinationIndex}`);

    // Create a working copy of the rankings
    const workingRankings = [...finalRankings];
    
    // Find the dragged Pokemon in the current rankings
    const draggedPokemon = workingRankings.find(p => p.id === draggedPokemonId);
    if (!draggedPokemon) {
      console.error(`🔧 [ENHANCED_REORDER] Pokemon ${draggedPokemonId} not found in rankings`);
      return;
    }

    // Physically move the Pokemon to the new position
    const [movedPokemon] = workingRankings.splice(sourceIndex, 1);
    workingRankings.splice(destinationIndex, 0, movedPokemon);

    const new_index = destinationIndex;
    const N = workingRankings.length;

    console.log(`🔧 [ENHANCED_REORDER] New position: ${new_index} out of ${N} total Pokemon`);

    // Ensure the dragged Pokemon has a valid TrueSkill rating
    if (!draggedPokemon.rating) {
      draggedPokemon.rating = new Rating();
    } else if (!(draggedPokemon.rating instanceof Rating)) {
      draggedPokemon.rating = new Rating(draggedPokemon.rating.mu, draggedPokemon.rating.sigma);
    }

    // Identify opponents and process implied battles
    const impliedBattles: Array<{
      opponent: RankedPokemon;
      draggedWins: boolean;
      battleType: string;
    }> = [];

    // P_above_1: Pokemon at new_index - 1 (dragged loses)
    if (new_index > 0) {
      const p_above_1 = workingRankings[new_index - 1];
      if (p_above_1 && p_above_1.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_above_1,
          draggedWins: false,
          battleType: "P_above_1"
        });
      }
    }

    // P_above_2: Pokemon at new_index - 2 (dragged loses)
    if (new_index > 1) {
      const p_above_2 = workingRankings[new_index - 2];
      if (p_above_2 && p_above_2.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_above_2,
          draggedWins: false,
          battleType: "P_above_2"
        });
      }
    }

    // P_below_1: Pokemon at new_index + 1 (dragged wins)
    if (new_index < N - 1) {
      const p_below_1 = workingRankings[new_index + 1];
      if (p_below_1 && p_below_1.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_below_1,
          draggedWins: true,
          battleType: "P_below_1"
        });
      }
    }

    // P_below_2: Pokemon at new_index + 2 (dragged wins)
    if (new_index < N - 2) {
      const p_below_2 = workingRankings[new_index + 2];
      if (p_below_2 && p_below_2.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_below_2,
          draggedWins: true,
          battleType: "P_below_2"
        });
      }
    }

    console.log(`🔧 [ENHANCED_REORDER] Processing ${impliedBattles.length} implied battles:`);

    // Process each implied battle with TrueSkill updates
    impliedBattles.forEach(({ opponent, draggedWins, battleType }) => {
      // Ensure opponent has a valid TrueSkill rating
      if (!opponent.rating) {
        opponent.rating = new Rating();
      } else if (!(opponent.rating instanceof Rating)) {
        opponent.rating = new Rating(opponent.rating.mu, opponent.rating.sigma);
      }

      console.log(`🔧 [ENHANCED_REORDER] ${battleType}: ${draggedPokemon.name} vs ${opponent.name} - ${draggedWins ? 'dragged wins' : 'opponent wins'}`);
      console.log(`🔧 [ENHANCED_REORDER] Before: ${draggedPokemon.name} μ=${draggedPokemon.rating.mu.toFixed(2)} σ=${draggedPokemon.rating.sigma.toFixed(2)}`);
      console.log(`🔧 [ENHANCED_REORDER] Before: ${opponent.name} μ=${opponent.rating.mu.toFixed(2)} σ=${opponent.rating.sigma.toFixed(2)}`);

      // Apply TrueSkill rating update
      let newDraggedRating: Rating;
      let newOpponentRating: Rating;

      if (draggedWins) {
        [newDraggedRating, newOpponentRating] = rate_1vs1(draggedPokemon.rating, opponent.rating);
      } else {
        [newOpponentRating, newDraggedRating] = rate_1vs1(opponent.rating, draggedPokemon.rating);
      }

      // Update the ratings
      draggedPokemon.rating = newDraggedRating;
      opponent.rating = newOpponentRating;

      console.log(`🔧 [ENHANCED_REORDER] After: ${draggedPokemon.name} μ=${draggedPokemon.rating.mu.toFixed(2)} σ=${draggedPokemon.rating.sigma.toFixed(2)}`);
      console.log(`🔧 [ENHANCED_REORDER] After: ${opponent.name} μ=${opponent.rating.mu.toFixed(2)} σ=${opponent.rating.sigma.toFixed(2)}`);
    });

    // Recalculate scores based on updated ratings
    workingRankings.forEach(pokemon => {
      if (pokemon.rating) {
        const conservativeEstimate = pokemon.rating.mu - 3 * pokemon.rating.sigma;
        pokemon.score = conservativeEstimate;
        pokemon.confidence = Math.max(0, Math.min(100, 100 * (1 - (pokemon.rating.sigma / 8.33))));
      }
    });

    // Re-sort the rankings based on updated scores
    workingRankings.sort((a, b) => b.score - a.score);

    console.log(`🔧 [ENHANCED_REORDER] Completed ${impliedBattles.length} TrueSkill updates for ${draggedPokemon.name}`);

    // Update the rankings
    onRankingsUpdate(workingRankings);

    // Show user feedback
    toast.success(`Enhanced ranking update for ${draggedPokemon.name}`, {
      description: `Applied ${impliedBattles.length} TrueSkill adjustments based on new position`
    });

  }, [finalRankings, pokemonLookupMap, onRankingsUpdate]);

  return { handleEnhancedManualReorder };
};
