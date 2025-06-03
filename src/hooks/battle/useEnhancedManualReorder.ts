
import { useCallback, useMemo } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { Rating } from "ts-trueskill";

export const useEnhancedManualReorder = (
  rankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean = false,
  addImpliedBattle?: (winnerId: number, loserId: number) => void
) => {
  const { updateRating, incrementBattleCount, incrementTotalBattles } = useTrueSkillStore();

  console.log(`🎯 [ENHANCED_MANUAL_REORDER] Hook initialized with ${rankings.length} rankings, preventAutoResorting: ${preventAutoResorting}`);

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🔍 [ORDER_TRACE] ===== ENHANCED MANUAL REORDER START =====`);
    console.log(`🔍 [ORDER_TRACE] Before drag: Current order:`, rankings.slice(0, 10).map((p, i) => `${i+1}.${p.name}(${p.id})`));
    console.log(`🔍 [ORDER_TRACE] Moving Pokemon ${draggedPokemonId} from position ${sourceIndex} to ${destinationIndex}`);

    if (sourceIndex === destinationIndex) {
      console.log(`🔍 [ORDER_TRACE] No position change, exiting`);
      return;
    }

    // Create the new manually ordered array
    const newRankings = [...rankings];
    const [movedPokemon] = newRankings.splice(sourceIndex, 1);
    newRankings.splice(destinationIndex, 0, movedPokemon);

    console.log(`🔍 [ORDER_TRACE] After manual move: New intended order:`, newRankings.slice(0, 10).map((p, i) => `${i+1}.${p.name}(${p.id})`));

    // Simulate implied battles if battle function is provided
    if (addImpliedBattle && typeof addImpliedBattle === 'function') {
      console.log(`🔍 [ORDER_TRACE] Simulating implied battles for reorder...`);
      
      // If moving up (to better position), pokemon beats those it passed
      if (destinationIndex < sourceIndex) {
        for (let i = destinationIndex; i < sourceIndex; i++) {
          const defeatedPokemon = newRankings[i + 1]; // +1 because movedPokemon is now at destinationIndex
          if (defeatedPokemon && defeatedPokemon.id !== draggedPokemonId) {
            console.log(`🔍 [ORDER_TRACE] Implied battle: ${movedPokemon.name} beats ${defeatedPokemon.name}`);
            addImpliedBattle(draggedPokemonId, defeatedPokemon.id);
          }
        }
      }
      // If moving down (to worse position), those it passed beat it
      else if (destinationIndex > sourceIndex) {
        for (let i = sourceIndex; i < destinationIndex; i++) {
          const superiorPokemon = newRankings[i]; // These pokemon are now above the moved one
          if (superiorPokemon && superiorPokemon.id !== draggedPokemonId) {
            console.log(`🔍 [ORDER_TRACE] Implied battle: ${superiorPokemon.name} beats ${movedPokemon.name}`);
            addImpliedBattle(superiorPokemon.id, draggedPokemonId);
          }
        }
      }
    }

    // Update TrueSkill ratings based on the new order if not preventing auto-resorting
    if (!preventAutoResorting) {
      console.log(`🔍 [ORDER_TRACE] Updating TrueSkill ratings based on new order...`);
      
      newRankings.forEach((pokemon, index) => {
        if (pokemon.rating) {
          // Slight adjustment based on position - higher positions get slightly better ratings
          const positionAdjustment = (newRankings.length - index) * 0.01;
          const adjustedMu = pokemon.rating.mu + positionAdjustment;
          const newRating = new Rating(adjustedMu, pokemon.rating.sigma);
          
          updateRating(pokemon.id.toString(), newRating);
          
          // Update the pokemon object with new score
          const conservativeEstimate = newRating.mu - newRating.sigma;
          pokemon.score = conservativeEstimate;
          pokemon.rating = newRating;
        }
      });

      // Re-sort by the updated scores if auto-resorting is allowed
      newRankings.sort((a, b) => b.score - a.score);
      console.log(`🔍 [ORDER_TRACE] After score updates: Final order:`, newRankings.slice(0, 10).map((p, i) => `${i+1}.${p.name}(${p.id}) [${p.score.toFixed(1)}]`));
    } else {
      console.log(`🔍 [ORDER_TRACE] preventAutoResorting is TRUE - preserving manual order without score-based re-sorting`);
      console.log(`🔍 [ORDER_TRACE] Order preservation verification:`, newRankings.slice(0, 10).map((p, i) => `${i+1}.${p.name}(${p.id})`));
    }

    // Update the state with the final rankings
    onRankingsUpdate(newRankings);
    
    console.log(`🔍 [ORDER_TRACE] ===== ENHANCED MANUAL REORDER COMPLETE =====`);
  }, [rankings, onRankingsUpdate, preventAutoResorting, addImpliedBattle, updateRating, incrementBattleCount, incrementTotalBattles]);

  return { handleEnhancedManualReorder };
};
