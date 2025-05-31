
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
    console.log(`🔥 [ENHANCED_REORDER] ===== MANUAL MODE REORDER =====`);
    console.log(`🔥 [ENHANCED_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    console.log(`🔥 [ENHANCED_REORDER] preventAutoResorting: ${preventAutoResorting}`);

    // CRITICAL DEBUG: Check if we have the required dependencies
    if (!finalRankings || finalRankings.length === 0) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ No finalRankings available! Length: ${finalRankings?.length}`);
      return;
    }

    if (!onRankingsUpdate) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ No onRankingsUpdate function provided!`);
      return;
    }

    if (!addImpliedBattle) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ No addImpliedBattle function available!`);
      return;
    }

    console.log(`🔥 [ENHANCED_REORDER] ✅ All dependencies verified, proceeding with logic...`);

    // Create a working copy of the rankings
    const workingRankings = [...finalRankings];
    console.log(`🔥 [ENHANCED_REORDER] Created working copy with ${workingRankings.length} Pokemon`);
    
    // NEW: Handle new Pokemon addition (sourceIndex = -1)
    let draggedPokemon: RankedPokemon;
    let draggedFinalIndex: number;
    
    if (sourceIndex === -1) {
      console.log(`🔥 [ENHANCED_REORDER] ===== NEW POKEMON ADDITION MODE =====`);
      console.log(`🔥 [ENHANCED_REORDER] Adding new Pokemon ${draggedPokemonId} at position ${destinationIndex}`);
      
      // Find the Pokemon in the lookup map
      const basePokemon = pokemonLookupMap.get(draggedPokemonId);
      if (!basePokemon) {
        console.error(`🔥 [ENHANCED_REORDER] ❌ Pokemon ${draggedPokemonId} not found in lookup map`);
        return;
      }
      
      // Get its TrueSkill rating
      const rating = getRating(draggedPokemonId);
      if (!rating) {
        console.error(`🔥 [ENHANCED_REORDER] ❌ No TrueSkill rating found for Pokemon ${draggedPokemonId}`);
        return;
      }
      
      // Create a RankedPokemon object
      const conservativeEstimate = rating.mu - 3 * rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      
      draggedPokemon = {
        ...basePokemon,
        score: conservativeEstimate,
        confidence: confidence,
        rating: rating
      } as RankedPokemon;
      
      // Insert at the destination position
      workingRankings.splice(destinationIndex, 0, draggedPokemon);
      draggedFinalIndex = destinationIndex;
      
      console.log(`🔥 [ENHANCED_REORDER] Created and inserted new Pokemon: ${draggedPokemon.name} at position ${draggedFinalIndex}`);
    } else {
      console.log(`🔥 [ENHANCED_REORDER] ===== EXISTING POKEMON REORDER MODE =====`);
      
      // Find the dragged Pokemon in the current rankings
      draggedPokemon = workingRankings.find(p => p.id === draggedPokemonId);
      if (!draggedPokemon) {
        console.error(`🔥 [ENHANCED_REORDER] ❌ Pokemon ${draggedPokemonId} not found in rankings`);
        return;
      }

      console.log(`🔥 [ENHANCED_REORDER] Found dragged Pokemon: ${draggedPokemon.name}`);

      // Perform the physical move
      const [movedPokemon] = workingRankings.splice(sourceIndex, 1);
      workingRankings.splice(destinationIndex, 0, movedPokemon);
      draggedFinalIndex = destinationIndex;
    }

    console.log(`🔥 [ENHANCED_REORDER] ===== AFTER MOVE - FINAL POSITIONS =====`);
    workingRankings.forEach((p, idx) => {
      if (idx <= draggedFinalIndex + 2 && idx >= draggedFinalIndex - 2) {
        console.log(`🔥 [ENHANCED_REORDER] Position ${idx}: ${p.name} (${p.id}) ${idx === draggedFinalIndex ? '← DRAGGED' : ''}`);
      }
    });

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

    // CRITICAL FIX FOR MANUAL MODE: Update TrueSkill store directly WITHOUT triggering sync events
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
            battleType: `${battleType} (${sourceIndex === -1 ? 'new addition' : 'manual rank'} update ${updateIndex + 1}/${frequency})`
          });
          console.log(`🔥 [ENHANCED_REORDER] ✅ Added implied battle update ${updateIndex + 1}/${frequency} to tracker`);
        } catch (error) {
          console.error(`🔥 [ENHANCED_REORDER] ❌ Error processing TrueSkill update ${updateIndex + 1}/${frequency}:`, error);
        }
      }

      // CRITICAL FIX FOR MANUAL MODE: Silent update without sync events
      if (preventAutoResorting) {
        console.log(`🔥 [ENHANCED_REORDER] MANUAL MODE: Silently updating TrueSkill store for ${opponent.name} (no sync events)`);
        // Directly update the store's internal ratings without triggering events
        const store = useTrueSkillStore.getState();
        store.ratings[opponent.id] = {
          mu: opponentRating.mu,
          sigma: opponentRating.sigma,
          lastUpdated: new Date().toISOString(),
          battleCount: (store.ratings[opponent.id]?.battleCount || 0) + frequency
        };
      } else {
        console.log(`🔥 [ENHANCED_REORDER] Updating centralized TrueSkill store for ${opponent.name}`);
        updateRating(opponent.id, opponentRating);
      }
    });

    // CRITICAL FIX FOR MANUAL MODE: Silent update for dragged Pokemon
    if (preventAutoResorting) {
      console.log(`🔥 [ENHANCED_REORDER] MANUAL MODE: Silently updating TrueSkill store for dragged Pokemon ${draggedPokemon.name} (no sync events)`);
      // Directly update the store's internal ratings without triggering events
      const store = useTrueSkillStore.getState();
      store.ratings[draggedPokemonId] = {
        mu: updatedDraggedRating.mu,
        sigma: updatedDraggedRating.sigma,
        lastUpdated: new Date().toISOString(),
        battleCount: (store.ratings[draggedPokemonId]?.battleCount || 0) + totalUpdates
      };
    } else {
      console.log(`🔥 [ENHANCED_REORDER] Updating centralized TrueSkill store for dragged Pokemon ${draggedPokemon.name}`);
      updateRating(draggedPokemonId, updatedDraggedRating);
    }

    console.log(`🔥 [ENHANCED_REORDER] ===== RECALCULATING SCORES =====`);

    // Recalculate scores based on updated ratings
    workingRankings.forEach(pokemon => {
      // Get the latest rating from centralized store OR use updated local values for manual mode
      let latestRating: Rating;
      
      if (preventAutoResorting) {
        // In manual mode, use the locally updated ratings
        if (pokemon.id === draggedPokemonId) {
          latestRating = updatedDraggedRating;
        } else {
          const battleAffected = impliedBattles.find(b => b.opponent.id === pokemon.id);
          if (battleAffected) {
            // This Pokemon was affected by the battles, get its updated rating from store
            const store = useTrueSkillStore.getState();
            const storedRating = store.ratings[pokemon.id];
            latestRating = storedRating ? new Rating(storedRating.mu, storedRating.sigma) : getRating(pokemon.id);
          } else {
            latestRating = getRating(pokemon.id);
          }
        }
      } else {
        latestRating = getRating(pokemon.id);
      }
      
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
      console.log(`🔥 [ENHANCED_REORDER] ===== MANUAL MODE: MAINTAINING USER ORDER =====`);
      console.log(`🔥 [ENHANCED_REORDER] Skipping re-sorting to preserve manual positioning`);
    } else {
      console.log(`🔥 [ENHANCED_REORDER] ===== RE-SORTING RANKINGS =====`);
      // Re-sort the rankings based on updated scores
      workingRankings.sort((a, b) => b.score - a.score);
    }

    console.log(`🔥 [ENHANCED_REORDER] ===== ENHANCED REORDER COMPLETE =====`);
    console.log(`🔥 [ENHANCED_REORDER] Successfully processed ${totalUpdates} TrueSkill updates for ${draggedPokemon.name} (${impliedBattles.length} battle types)`);

    // CRITICAL FIX: For new Pokemon additions, use a different event to prevent double insertion
    if (sourceIndex === -1) {
      console.log(`🔥 [ENHANCED_REORDER] NEW POKEMON: Dispatching insertion event without auto-sync`);
      // Dispatch a different event that won't trigger the insertion logic in useTrueSkillSync
      const insertionEvent = new CustomEvent('pokemon-manually-inserted', {
        detail: { 
          pokemonId: draggedPokemonId,
          insertionPosition: destinationIndex,
          timestamp: Date.now()
        }
      });
      document.dispatchEvent(insertionEvent);
    } else if (!preventAutoResorting) {
      // Only dispatch sync events for reordering in non-manual modes
      const syncEvent = new CustomEvent('trueskill-updated', {
        detail: { 
          source: 'manual-reorder',
          pokemonUpdated: [draggedPokemonId, ...impliedBattles.map(b => b.opponent.id)],
          timestamp: Date.now()
        }
      });
      document.dispatchEvent(syncEvent);
      console.log(`🔥 [ENHANCED_REORDER] Dispatched TrueSkill sync event for Battle Mode`);
    } else {
      console.log(`🔥 [ENHANCED_REORDER] MANUAL MODE: Skipping sync events to prevent auto-resorting`);
    }

    // Update the rankings
    try {
      onRankingsUpdate(workingRankings);
      console.log(`🔥 [ENHANCED_REORDER] ✅ Rankings update called successfully`);
    } catch (error) {
      console.error(`🔥 [ENHANCED_REORDER] ❌ Error calling onRankingsUpdate:`, error);
    }

    // Show user feedback with updated information
    const feedbackMessage = sourceIndex === -1 
      ? `Added ${draggedPokemon.name} with implied battles` 
      : preventAutoResorting 
        ? `Manual position set for ${draggedPokemon.name}` 
        : `Enhanced ranking update for ${draggedPokemon.name}`;
    
    const feedbackDescription = sourceIndex === -1
      ? `Applied ${totalUpdates} TrueSkill adjustments based on insertion position`
      : preventAutoResorting
        ? `Position locked at rank ${destinationIndex + 1}, TrueSkill adjusted silently`
        : `Applied ${totalUpdates} TrueSkill adjustments (immediate neighbors weighted 2x)`;

    toast.success(feedbackMessage, {
      description: feedbackDescription
    });

  }, [finalRankings, pokemonLookupMap, onRankingsUpdate, addImpliedBattle, preventAutoResorting, getRating, updateRating]);

  return { handleEnhancedManualReorder };
};
