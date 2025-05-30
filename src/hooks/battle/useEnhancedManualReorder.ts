
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { Rating, rate_1vs1 } from "ts-trueskill";
import { toast } from "sonner";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useImpliedBattleTracker } from "@/contexts/ImpliedBattleTracker";

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void
) => {
  const { pokemonLookupMap } = usePokemonContext();
  const { addImpliedBattle } = useImpliedBattleTracker();

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    console.log(`🔥 [ENHANCED_REORDER] ===== STARTING ENHANCED MANUAL REORDER =====`);
    console.log(`🔥 [ENHANCED_REORDER] Pokemon ID: ${draggedPokemonId}`);
    console.log(`🔥 [ENHANCED_REORDER] Source Index: ${sourceIndex} → Destination Index: ${destinationIndex}`);
    console.log(`🔥 [ENHANCED_REORDER] Total rankings available: ${finalRankings.length}`);

    // Create a working copy of the rankings
    const workingRankings = [...finalRankings];
    
    // Find the dragged Pokemon in the current rankings
    const draggedPokemon = workingRankings.find(p => p.id === draggedPokemonId);
    if (!draggedPokemon) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ Pokemon ${draggedPokemonId} not found in rankings`);
      return;
    }

    console.log(`🔥 [ENHANCED_REORDER] Found dragged Pokemon: ${draggedPokemon.name}`);

    // Physically move the Pokemon to the new position
    const [movedPokemon] = workingRankings.splice(sourceIndex, 1);
    workingRankings.splice(destinationIndex, 0, movedPokemon);

    const new_index = destinationIndex;
    const N = workingRankings.length;

    console.log(`🔥 [ENHANCED_REORDER] New position: ${new_index} out of ${N} total Pokemon`);

    // Ensure the dragged Pokemon has a valid TrueSkill rating
    if (!draggedPokemon.rating) {
      draggedPokemon.rating = new Rating();
      console.log(`🔥 [ENHANCED_REORDER] Created new Rating for ${draggedPokemon.name}`);
    } else if (!(draggedPokemon.rating instanceof Rating)) {
      draggedPokemon.rating = new Rating(draggedPokemon.rating.mu, draggedPokemon.rating.sigma);
      console.log(`🔥 [ENHANCED_REORDER] Converted rating object to Rating instance for ${draggedPokemon.name}`);
    }

    // Identify opponents and process implied battles
    const impliedBattles: Array<{
      opponent: RankedPokemon;
      draggedWins: boolean;
      battleType: string;
    }> = [];

    console.log(`🔥 [ENHANCED_REORDER] ===== IDENTIFYING IMPLIED BATTLES =====`);

    // P_above_1: Pokemon at new_index - 1 (dragged loses)
    if (new_index > 0) {
      const p_above_1 = workingRankings[new_index - 1];
      if (p_above_1 && p_above_1.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_above_1,
          draggedWins: false,
          battleType: "P_above_1"
        });
        console.log(`🔥 [ENHANCED_REORDER] Added P_above_1 battle: ${draggedPokemon.name} LOSES to ${p_above_1.name}`);
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
        console.log(`🔥 [ENHANCED_REORDER] Added P_above_2 battle: ${draggedPokemon.name} LOSES to ${p_above_2.name}`);
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
        console.log(`🔥 [ENHANCED_REORDER] Added P_below_1 battle: ${draggedPokemon.name} WINS against ${p_below_1.name}`);
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
        console.log(`🔥 [ENHANCED_REORDER] Added P_below_2 battle: ${draggedPokemon.name} WINS against ${p_below_2.name}`);
      }
    }

    console.log(`🔥 [ENHANCED_REORDER] ===== PROCESSING ${impliedBattles.length} IMPLIED BATTLES =====`);

    if (impliedBattles.length === 0) {
      console.log(`🔥 [ENHANCED_REORDER] ⚠️ No implied battles to process`);
      onRankingsUpdate(workingRankings);
      return;
    }

    // Process each implied battle with TrueSkill updates
    impliedBattles.forEach(({ opponent, draggedWins, battleType }, index) => {
      console.log(`🔥 [ENHANCED_REORDER] --- Battle ${index + 1}/${impliedBattles.length}: ${battleType} ---`);
      
      // Ensure opponent has a valid TrueSkill rating
      if (!opponent.rating) {
        opponent.rating = new Rating();
        console.log(`🔥 [ENHANCED_REORDER] Created new Rating for opponent ${opponent.name}`);
      } else if (!(opponent.rating instanceof Rating)) {
        opponent.rating = new Rating(opponent.rating.mu, opponent.rating.sigma);
        console.log(`🔥 [ENHANCED_REORDER] Converted rating object to Rating instance for opponent ${opponent.name}`);
      }

      console.log(`🔥 [ENHANCED_REORDER] Battle: ${draggedPokemon.name} vs ${opponent.name} - ${draggedWins ? 'dragged wins' : 'opponent wins'}`);
      console.log(`🔥 [ENHANCED_REORDER] BEFORE - ${draggedPokemon.name}: μ=${draggedPokemon.rating.mu.toFixed(3)} σ=${draggedPokemon.rating.sigma.toFixed(3)}`);
      console.log(`🔥 [ENHANCED_REORDER] BEFORE - ${opponent.name}: μ=${opponent.rating.mu.toFixed(3)} σ=${opponent.rating.sigma.toFixed(3)}`);

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

      console.log(`🔥 [ENHANCED_REORDER] AFTER  - ${draggedPokemon.name}: μ=${draggedPokemon.rating.mu.toFixed(3)} σ=${draggedPokemon.rating.sigma.toFixed(3)}`);
      console.log(`🔥 [ENHANCED_REORDER] AFTER  - ${opponent.name}: μ=${opponent.rating.mu.toFixed(3)} σ=${opponent.rating.sigma.toFixed(3)}`);

      // Add to implied battle tracker for validation
      console.log(`🔥 [ENHANCED_REORDER] Adding to implied battle tracker...`);
      addImpliedBattle({
        draggedPokemon: draggedPokemon.name,
        opponent: opponent.name,
        winner: draggedWins ? draggedPokemon.name : opponent.name,
        battleType: `${battleType} (manual rank)`
      });
      console.log(`🔥 [ENHANCED_REORDER] Added implied battle to tracker`);
    });

    console.log(`🔥 [ENHANCED_REORDER] ===== RECALCULATING SCORES =====`);

    // Recalculate scores based on updated ratings
    workingRankings.forEach(pokemon => {
      if (pokemon.rating) {
        const oldScore = pokemon.score;
        const conservativeEstimate = pokemon.rating.mu - 3 * pokemon.rating.sigma;
        pokemon.score = conservativeEstimate;
        pokemon.confidence = Math.max(0, Math.min(100, 100 * (1 - (pokemon.rating.sigma / 8.33))));
        
        if (pokemon.id === draggedPokemonId || impliedBattles.some(b => b.opponent.id === pokemon.id)) {
          console.log(`🔥 [ENHANCED_REORDER] Score update - ${pokemon.name}: ${oldScore?.toFixed(3)} → ${pokemon.score.toFixed(3)} (confidence: ${pokemon.confidence.toFixed(1)}%)`);
        }
      }
    });

    console.log(`🔥 [ENHANCED_REORDER] ===== RE-SORTING RANKINGS =====`);

    // Re-sort the rankings based on updated scores
    workingRankings.sort((a, b) => b.score - a.score);

    console.log(`🔥 [ENHANCED_REORDER] ===== ENHANCED REORDER COMPLETE =====`);
    console.log(`🔥 [ENHANCED_REORDER] Successfully processed ${impliedBattles.length} TrueSkill updates for ${draggedPokemon.name}`);

    // Update the rankings
    onRankingsUpdate(workingRankings);

    // Show user feedback
    toast.success(`Enhanced ranking update for ${draggedPokemon.name}`, {
      description: `Applied ${impliedBattles.length} TrueSkill adjustments based on new position`
    });

  }, [finalRankings, pokemonLookupMap, onRankingsUpdate, addImpliedBattle]);

  return { handleEnhancedManualReorder };
};
