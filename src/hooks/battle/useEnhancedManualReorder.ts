
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { Rating, rate_1vs1 } from "ts-trueskill";
import { toast } from "sonner";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useImpliedBattleTracker } from "@/contexts/ImpliedBattleTracker";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean = false // NEW: Flag to prevent auto-resorting
) => {
  const { pokemonLookupMap } = usePokemonContext();
  const { addImpliedBattle } = useImpliedBattleTracker();
  const { getRating, updateRating } = useTrueSkillStore();

  console.log(`🔥 [ENHANCED_REORDER_HOOK_INIT] ===== HOOK INITIALIZATION =====`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK_INIT] finalRankings length: ${finalRankings?.length || 0}`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK_INIT] onRankingsUpdate exists: ${!!onRankingsUpdate}`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK_INIT] preventAutoResorting: ${preventAutoResorting}`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK_INIT] addImpliedBattle exists: ${!!addImpliedBattle}`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK_INIT] pokemonLookupMap size: ${pokemonLookupMap?.size || 0}`);

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    console.log(`🔥 [ENHANCED_REORDER] ===== FUNCTION ENTRY POINT =====`);
    console.log(`🔥 [ENHANCED_REORDER] This function was called! Parameters:`);
    console.log(`🔥 [ENHANCED_REORDER] - draggedPokemonId: ${draggedPokemonId}`);
    console.log(`🔥 [ENHANCED_REORDER] - sourceIndex: ${sourceIndex}`);
    console.log(`🔥 [ENHANCED_REORDER] - destinationIndex: ${destinationIndex}`);
    console.log(`🔥 [ENHANCED_REORDER] - preventAutoResorting: ${preventAutoResorting}`);
    console.log(`🔥 [ENHANCED_REORDER] - finalRankings available: ${!!finalRankings}`);
    console.log(`🔥 [ENHANCED_REORDER] - finalRankings length: ${finalRankings?.length || 0}`);
    console.log(`🔥 [ENHANCED_REORDER] - onRankingsUpdate available: ${!!onRankingsUpdate}`);
    console.log(`🔥 [ENHANCED_REORDER] - addImpliedBattle available: ${!!addImpliedBattle}`);

    // CRITICAL DEBUG: Check if we have the required dependencies
    if (!finalRankings || finalRankings.length === 0) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ No finalRankings available! Length: ${finalRankings?.length}`);
      console.error(`🔥 [ENHANCED_REORDER] ❌ Raw finalRankings:`, finalRankings);
      return;
    }

    if (!onRankingsUpdate) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ No onRankingsUpdate function provided!`);
      console.error(`🔥 [ENHANCED_REORDER] ❌ onRankingsUpdate value:`, onRankingsUpdate);
      return;
    }

    if (!addImpliedBattle) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ No addImpliedBattle function available!`);
      console.error(`🔥 [ENHANCED_REORDER] ❌ addImpliedBattle value:`, addImpliedBattle);
      return;
    }

    console.log(`🔥 [ENHANCED_REORDER] ✅ All dependencies verified, proceeding with logic...`);

    // Create a working copy of the rankings
    const workingRankings = [...finalRankings];
    console.log(`🔥 [ENHANCED_REORDER] Created working copy with ${workingRankings.length} Pokemon`);
    
    // Find the dragged Pokemon in the current rankings
    const draggedPokemon = workingRankings.find(p => p.id === draggedPokemonId);
    if (!draggedPokemon) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ Pokemon ${draggedPokemonId} not found in rankings`);
      console.error(`🔥 [ENHANCED_REORDER] ❌ Available Pokemon IDs:`, workingRankings.map(p => p.id));
      return;
    }

    console.log(`🔥 [ENHANCED_REORDER] Found dragged Pokemon: ${draggedPokemon.name}`);

    console.log(`🔥 [ENHANCED_REORDER] ===== BEFORE MOVE POSITIONS =====`);
    workingRankings.forEach((p, idx) => {
      console.log(`🔥 [ENHANCED_REORDER] Position ${idx}: ${p.name} (${p.id})`);
    });

    // STEP 1: Perform the physical move to get final positions
    const [movedPokemon] = workingRankings.splice(sourceIndex, 1);
    workingRankings.splice(destinationIndex, 0, movedPokemon);

    console.log(`🔥 [ENHANCED_REORDER] ===== AFTER MOVE - FINAL POSITIONS =====`);
    workingRankings.forEach((p, idx) => {
      console.log(`🔥 [ENHANCED_REORDER] Position ${idx}: ${p.name} (${p.id})`);
    });

    const draggedFinalIndex = destinationIndex;
    const N = workingRankings.length;

    console.log(`🔥 [ENHANCED_REORDER] Dragged Pokemon final position: ${draggedFinalIndex} out of ${N} total Pokemon`);

    // STEP 2: NOW identify opponents using the FINAL positions after ALL movements
    const impliedBattles: Array<{
      opponent: RankedPokemon;
      draggedWins: boolean;
      battleType: string;
      frequency: number;
    }> = [];

    console.log(`🔥 [ENHANCED_REORDER] ===== IDENTIFYING OPPONENTS USING FINAL POSITIONS =====`);

    // P_above_1: Pokemon at draggedFinalIndex - 1 (dragged loses) - IMMEDIATE NEIGHBOR: 2 updates
    if (draggedFinalIndex > 0) {
      const p_above_1 = workingRankings[draggedFinalIndex - 1];
      if (p_above_1 && p_above_1.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_above_1,
          draggedWins: false,
          battleType: "P_above_1",
          frequency: 2
        });
        console.log(`🔥 [ENHANCED_REORDER] Added P_above_1 battle: ${draggedPokemon.name} LOSES to ${p_above_1.name} (FREQUENCY: 2)`);
        console.log(`🔥 [ENHANCED_REORDER] P_above_1 is at final position ${draggedFinalIndex - 1}`);
      }
    }

    // P_above_2: Pokemon at draggedFinalIndex - 2 (dragged loses) - SECONDARY NEIGHBOR: 1 update
    if (draggedFinalIndex > 1) {
      const p_above_2 = workingRankings[draggedFinalIndex - 2];
      if (p_above_2 && p_above_2.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_above_2,
          draggedWins: false,
          battleType: "P_above_2",
          frequency: 1
        });
        console.log(`🔥 [ENHANCED_REORDER] Added P_above_2 battle: ${draggedPokemon.name} LOSES to ${p_above_2.name} (FREQUENCY: 1)`);
        console.log(`🔥 [ENHANCED_REORDER] P_above_2 is at final position ${draggedFinalIndex - 2}`);
      }
    }

    // P_below_1: Pokemon at draggedFinalIndex + 1 (dragged wins) - IMMEDIATE NEIGHBOR: 2 updates
    if (draggedFinalIndex < N - 1) {
      const p_below_1 = workingRankings[draggedFinalIndex + 1];
      if (p_below_1 && p_below_1.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_below_1,
          draggedWins: true,
          battleType: "P_below_1",
          frequency: 2
        });
        console.log(`🔥 [ENHANCED_REORDER] Added P_below_1 battle: ${draggedPokemon.name} WINS against ${p_below_1.name} (FREQUENCY: 2)`);
        console.log(`🔥 [ENHANCED_REORDER] P_below_1 is at final position ${draggedFinalIndex + 1}`);
      }
    }

    // P_below_2: Pokemon at draggedFinalIndex + 2 (dragged wins) - SECONDARY NEIGHBOR: 1 update
    if (draggedFinalIndex < N - 2) {
      const p_below_2 = workingRankings[draggedFinalIndex + 2];
      if (p_below_2 && p_below_2.id !== draggedPokemonId) {
        impliedBattles.push({
          opponent: p_below_2,
          draggedWins: true,
          battleType: "P_below_2",
          frequency: 1
        });
        console.log(`🔥 [ENHANCED_REORDER] Added P_below_2 battle: ${draggedPokemon.name} WINS against ${p_below_2.name} (FREQUENCY: 1)`);
        console.log(`🔥 [ENHANCED_REORDER] P_below_2 is at final position ${draggedFinalIndex + 2}`);
      }
    }

    // Get current TrueSkill ratings from centralized store
    let draggedRating = getRating(draggedPokemonId);
    if (!draggedRating) {
      draggedRating = new Rating();
      console.log(`🔥 [ENHANCED_REORDER] Created new Rating for ${draggedPokemon.name}`);
    }

    const totalUpdates = impliedBattles.reduce((sum, battle) => sum + battle.frequency, 0);
    console.log(`🔥 [ENHANCED_REORDER] ===== PROCESSING ${impliedBattles.length} IMPLIED BATTLE TYPES (${totalUpdates} total TrueSkill updates) =====`);

    if (impliedBattles.length === 0) {
      console.log(`🔥 [ENHANCED_REORDER] ⚠️ No implied battles to process`);
      onRankingsUpdate(workingRankings);
      return;
    }

    // CRITICAL FIX: Update TrueSkill store directly for proper synchronization
    let updatedDraggedRating = draggedRating;

    // Process each implied battle with the specified frequency
    impliedBattles.forEach(({ opponent, draggedWins, battleType, frequency }, battleIndex) => {
      console.log(`🔥 [ENHANCED_REORDER] --- Battle Type ${battleIndex + 1}/${impliedBattles.length}: ${battleType} (${frequency}x) ---`);
      
      // Get opponent rating from centralized store
      let opponentRating = getRating(opponent.id);
      if (!opponentRating) {
        opponentRating = new Rating();
        console.log(`🔥 [ENHANCED_REORDER] Created new Rating for opponent ${opponent.name}`);
      }

      // Process the battle the specified number of times
      for (let updateIndex = 0; updateIndex < frequency; updateIndex++) {
        console.log(`🔥 [ENHANCED_REORDER] Battle Update ${updateIndex + 1}/${frequency}: ${draggedPokemon.name} vs ${opponent.name} - ${draggedWins ? 'dragged wins' : 'opponent wins'}`);
        console.log(`🔥 [ENHANCED_REORDER] BEFORE Update ${updateIndex + 1} - ${draggedPokemon.name}: μ=${updatedDraggedRating.mu.toFixed(3)} σ=${updatedDraggedRating.sigma.toFixed(3)}`);
        console.log(`🔥 [ENHANCED_REORDER] BEFORE Update ${updateIndex + 1} - ${opponent.name}: μ=${opponentRating.mu.toFixed(3)} σ=${opponentRating.sigma.toFixed(3)}`);

        // Apply TrueSkill rating update
        let newDraggedRating: Rating;
        let newOpponentRating: Rating;

        try {
          if (draggedWins) {
            [newDraggedRating, newOpponentRating] = rate_1vs1(updatedDraggedRating, opponentRating);
          } else {
            [newOpponentRating, newDraggedRating] = rate_1vs1(opponentRating, updatedDraggedRating);
          }

          // Update the ratings
          updatedDraggedRating = newDraggedRating;
          opponentRating = newOpponentRating;

          console.log(`🔥 [ENHANCED_REORDER] AFTER Update ${updateIndex + 1}  - ${draggedPokemon.name}: μ=${updatedDraggedRating.mu.toFixed(3)} σ=${updatedDraggedRating.sigma.toFixed(3)}`);
          console.log(`🔥 [ENHANCED_REORDER] AFTER Update ${updateIndex + 1}  - ${opponent.name}: μ=${opponentRating.mu.toFixed(3)} σ=${opponentRating.sigma.toFixed(3)}`);

          // Add to implied battle tracker for each individual update
          console.log(`🔥 [ENHANCED_REORDER] Adding update ${updateIndex + 1}/${frequency} to implied battle tracker...`);
          addImpliedBattle({
            draggedPokemon: draggedPokemon.name,
            opponent: opponent.name,
            winner: draggedWins ? draggedPokemon.name : opponent.name,
            battleType: `${battleType} (manual rank update ${updateIndex + 1}/${frequency})`
          });
          console.log(`🔥 [ENHANCED_REORDER] ✅ Added implied battle update ${updateIndex + 1}/${frequency} to tracker`);
        } catch (error) {
          console.error(`🔥 [ENHANCED_REORDER] ❌ Error processing TrueSkill update ${updateIndex + 1}/${frequency}:`, error);
        }
      }

      // CRITICAL FIX: Update centralized TrueSkill store for proper synchronization
      console.log(`🔥 [ENHANCED_REORDER] Updating centralized TrueSkill store for ${opponent.name}`);
      updateRating(opponent.id, opponentRating);
    });

    // CRITICAL FIX: Update centralized TrueSkill store for dragged Pokemon
    console.log(`🔥 [ENHANCED_REORDER] Updating centralized TrueSkill store for dragged Pokemon ${draggedPokemon.name}`);
    updateRating(draggedPokemonId, updatedDraggedRating);

    console.log(`🔥 [ENHANCED_REORDER] ===== RECALCULATING SCORES =====`);

    // Recalculate scores based on updated ratings
    workingRankings.forEach(pokemon => {
      // Get the latest rating from centralized store
      const latestRating = getRating(pokemon.id);
      if (latestRating) {
        const oldScore = pokemon.score;
        const conservativeEstimate = latestRating.mu - 3 * latestRating.sigma;
        pokemon.score = conservativeEstimate;
        pokemon.confidence = Math.max(0, Math.min(100, 100 * (1 - (latestRating.sigma / 8.33))));
        pokemon.rating = latestRating; // Update the rating reference
        
        if (pokemon.id === draggedPokemonId || impliedBattles.some(b => b.opponent.id === pokemon.id)) {
          console.log(`🔥 [ENHANCED_REORDER] Score update - ${pokemon.name}: ${oldScore?.toFixed(3)} → ${pokemon.score.toFixed(3)} (confidence: ${pokemon.confidence.toFixed(1)}%)`);
        }
      }
    });

    // CRITICAL FIX: Skip re-sorting if preventAutoResorting is true
    if (preventAutoResorting) {
      console.log(`🔥 [ENHANCED_REORDER] ===== SKIPPING RE-SORTING (preventAutoResorting = true) =====`);
      console.log(`🔥 [ENHANCED_REORDER] Maintaining manual order to preserve user experience`);
    } else {
      console.log(`🔥 [ENHANCED_REORDER] ===== RE-SORTING RANKINGS =====`);
      // Re-sort the rankings based on updated scores
      workingRankings.sort((a, b) => b.score - a.score);
    }

    console.log(`🔥 [ENHANCED_REORDER] ===== ENHANCED REORDER COMPLETE =====`);
    console.log(`🔥 [ENHANCED_REORDER] Successfully processed ${totalUpdates} TrueSkill updates for ${draggedPokemon.name} (${impliedBattles.length} battle types)`);

    // CRITICAL FIX: Dispatch synchronization event for Manual Mode
    const syncEvent = new CustomEvent('trueskill-updated', {
      detail: { 
        source: 'manual-reorder',
        pokemonUpdated: [draggedPokemonId, ...impliedBattles.map(b => b.opponent.id)],
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(syncEvent);
    console.log(`🔥 [ENHANCED_REORDER] Dispatched TrueSkill sync event for Manual Mode`);

    // Update the rankings
    try {
      onRankingsUpdate(workingRankings);
      console.log(`🔥 [ENHANCED_REORDER] ✅ Rankings update called successfully`);
    } catch (error) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ Error calling onRankingsUpdate:`, error);
    }

    // Show user feedback with updated information
    const feedbackMessage = preventAutoResorting 
      ? `Manual reorder for ${draggedPokemon.name}` 
      : `Enhanced ranking update for ${draggedPokemon.name}`;
    
    const feedbackDescription = preventAutoResorting
      ? `Position updated, TrueSkill adjusted (${totalUpdates} updates)`
      : `Applied ${totalUpdates} TrueSkill adjustments (immediate neighbors weighted 2x)`;

    toast.success(feedbackMessage, {
      description: feedbackDescription
    });

  }, [finalRankings, pokemonLookupMap, onRankingsUpdate, addImpliedBattle, preventAutoResorting, getRating, updateRating]);

  console.log(`🔥 [ENHANCED_REORDER_HOOK] Hook created with ${finalRankings?.length || 0} rankings`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK] onRankingsUpdate exists: ${!!onRankingsUpdate}`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK] preventAutoResorting: ${preventAutoResorting}`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK] addImpliedBattle exists: ${!!addImpliedBattle}`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK] Returning function: ${handleEnhancedManualReorder.name || 'anonymous'}`);

  return { handleEnhancedManualReorder };
};
