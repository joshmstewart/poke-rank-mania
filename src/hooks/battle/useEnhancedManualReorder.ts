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
  preventAutoResorting: boolean = false
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
    console.log(`🔥 [ENHANCED_REORDER] ===== STRENGTHENED MANUAL MODE REORDER =====`);
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

    console.log(`🔥 [ENHANCED_REORDER] ✅ All dependencies verified, proceeding with strengthened logic...`);

    // Create a working copy of the rankings
    const workingRankings = [...finalRankings];
    console.log(`🔥 [ENHANCED_REORDER] Created working copy with ${workingRankings.length} Pokemon`);
    
    // Handle new Pokemon addition (sourceIndex = -1) or existing Pokemon reorder
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
      
      // Get its TrueSkill rating - using string ID
      const rating = getRating(draggedPokemonId.toString());
      
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
      if (idx <= draggedFinalIndex + 3 && idx >= draggedFinalIndex - 3) {
        console.log(`🔥 [ENHANCED_REORDER] Position ${idx}: ${p.name} (${p.id}) ${idx === draggedFinalIndex ? '← DRAGGED' : ''}`);
      }
    });

    const N = workingRankings.length;
    console.log(`🔥 [ENHANCED_REORDER] Dragged Pokemon final position: ${draggedFinalIndex} out of ${N} total Pokemon`);

    // STEP 2: STRENGTHENED IMPLIED BATTLES with new logic
    const impliedBattles: Array<{
      opponent: RankedPokemon;
      draggedWins: boolean;
      battleType: string;
      frequency: number;
    }> = [];

    console.log(`🔥 [ENHANCED_REORDER] ===== GENERATING STRENGTHENED IMPLIED BATTLES =====`);

    // NEW STRENGTHENED LOGIC: Based on specific position rules
    const position = draggedFinalIndex + 1; // Convert to 1-based indexing for easier logic

    if (position === 1) {
      // Special case: #1 spot - battle against spots 2, 3, and 4 two times each
      console.log(`🔥 [ENHANCED_REORDER] POSITION #1 SPECIAL RULES: Battle against #2, #3, #4 twice each`);
      
      for (let targetPos = 2; targetPos <= 4; targetPos++) {
        const targetIndex = targetPos - 1; // Convert back to 0-based
        if (targetIndex < N) {
          const opponent = workingRankings[targetIndex];
          if (opponent && opponent.id !== draggedPokemonId) {
            impliedBattles.push({
              opponent: opponent,
              draggedWins: true, // #1 beats everyone below
              battleType: `Position_1_vs_${targetPos}`,
              frequency: 2
            });
            console.log(`🔥 [ENHANCED_REORDER] Added #1 special battle: ${draggedPokemon.name} WINS 2x against #${targetPos} ${opponent.name}`);
          }
        }
      }
    } else if (position === 2) {
      // Special case: #2 spot - battle against #1 twice, #3 twice, #4 twice, #5 once
      console.log(`🔥 [ENHANCED_REORDER] POSITION #2 SPECIAL RULES`);
      
      // Battle against #1 twice (loses)
      if (draggedFinalIndex > 0) {
        const opponent = workingRankings[0];
        if (opponent && opponent.id !== draggedPokemonId) {
          impliedBattles.push({
            opponent: opponent,
            draggedWins: false,
            battleType: `Position_2_vs_1`,
            frequency: 2
          });
          console.log(`🔥 [ENHANCED_REORDER] Added #2 special battle: ${draggedPokemon.name} LOSES 2x to #1 ${opponent.name}`);
        }
      }
      
      // Battle against #3, #4 twice each (wins)
      for (let targetPos = 3; targetPos <= 4; targetPos++) {
        const targetIndex = targetPos - 1;
        if (targetIndex < N) {
          const opponent = workingRankings[targetIndex];
          if (opponent && opponent.id !== draggedPokemonId) {
            impliedBattles.push({
              opponent: opponent,
              draggedWins: true,
              battleType: `Position_2_vs_${targetPos}`,
              frequency: 2
            });
            console.log(`🔥 [ENHANCED_REORDER] Added #2 special battle: ${draggedPokemon.name} WINS 2x against #${targetPos} ${opponent.name}`);
          }
        }
      }
      
      // Battle against #5 once (wins)
      if (4 < N) {
        const opponent = workingRankings[4];
        if (opponent && opponent.id !== draggedPokemonId) {
          impliedBattles.push({
            opponent: opponent,
            draggedWins: true,
            battleType: `Position_2_vs_5`,
            frequency: 1
          });
          console.log(`🔥 [ENHANCED_REORDER] Added #2 special battle: ${draggedPokemon.name} WINS 1x against #5 ${opponent.name}`);
        }
      }
    } else if (position === 3) {
      // Special case: #3 spot - battle against #1 twice, #2 twice, #4 twice, #5 once, #6 once
      console.log(`🔥 [ENHANCED_REORDER] POSITION #3 SPECIAL RULES`);
      
      // Battle against #1, #2 twice each (loses)
      for (let targetPos = 1; targetPos <= 2; targetPos++) {
        const targetIndex = targetPos - 1;
        if (targetIndex >= 0) {
          const opponent = workingRankings[targetIndex];
          if (opponent && opponent.id !== draggedPokemonId) {
            impliedBattles.push({
              opponent: opponent,
              draggedWins: false,
              battleType: `Position_3_vs_${targetPos}`,
              frequency: 2
            });
            console.log(`🔥 [ENHANCED_REORDER] Added #3 special battle: ${draggedPokemon.name} LOSES 2x to #${targetPos} ${opponent.name}`);
          }
        }
      }
      
      // Battle against #4 twice (wins)
      if (3 < N) {
        const opponent = workingRankings[3];
        if (opponent && opponent.id !== draggedPokemonId) {
          impliedBattles.push({
            opponent: opponent,
            draggedWins: true,
            battleType: `Position_3_vs_4`,
            frequency: 2
          });
          console.log(`🔥 [ENHANCED_REORDER] Added #3 special battle: ${draggedPokemon.name} WINS 2x against #4 ${opponent.name}`);
        }
      }
      
      // Battle against #5, #6 once each (wins)
      for (let targetPos = 5; targetPos <= 6; targetPos++) {
        const targetIndex = targetPos - 1;
        if (targetIndex < N) {
          const opponent = workingRankings[targetIndex];
          if (opponent && opponent.id !== draggedPokemonId) {
            impliedBattles.push({
              opponent: opponent,
              draggedWins: true,
              battleType: `Position_3_vs_${targetPos}`,
              frequency: 1
            });
            console.log(`🔥 [ENHANCED_REORDER] Added #3 special battle: ${draggedPokemon.name} WINS 1x against #${targetPos} ${opponent.name}`);
          }
        }
      }
    } else {
      // General case (position 4+): Standard strengthened logic
      console.log(`🔥 [ENHANCED_REORDER] GENERAL POSITION RULES: 1-3 spaces up/down with varying frequencies`);
      
      // Battle against 1, 2, 3 spaces above (dragged loses)
      for (let distance = 1; distance <= 3; distance++) {
        const targetIndex = draggedFinalIndex - distance;
        if (targetIndex >= 0) {
          const opponent = workingRankings[targetIndex];
          if (opponent && opponent.id !== draggedPokemonId) {
            const frequency = distance === 1 ? 3 : 1; // 1 space up = 3 times, others = 1 time
            impliedBattles.push({
              opponent: opponent,
              draggedWins: false,
              battleType: `P_above_${distance}`,
              frequency: frequency
            });
            console.log(`🔥 [ENHANCED_REORDER] Added general battle: ${draggedPokemon.name} LOSES ${frequency}x to ${opponent.name} (${distance} spaces above)`);
          }
        }
      }
      
      // Battle against 1, 2, 3 spaces below (dragged wins)
      for (let distance = 1; distance <= 3; distance++) {
        const targetIndex = draggedFinalIndex + distance;
        if (targetIndex < N) {
          const opponent = workingRankings[targetIndex];
          if (opponent && opponent.id !== draggedPokemonId) {
            const frequency = distance === 1 ? 3 : 1; // 1 space down = 3 times, others = 1 time
            impliedBattles.push({
              opponent: opponent,
              draggedWins: true,
              battleType: `P_below_${distance}`,
              frequency: frequency
            });
            console.log(`🔥 [ENHANCED_REORDER] Added general battle: ${draggedPokemon.name} WINS ${frequency}x against ${opponent.name} (${distance} spaces below)`);
          }
        }
      }
    }

    // Get current TrueSkill ratings from centralized store - using string IDs
    let draggedRating = getRating(draggedPokemonId.toString());

    const totalUpdates = impliedBattles.reduce((sum, battle) => sum + battle.frequency, 0);
    console.log(`🔥 [ENHANCED_REORDER] ===== PROCESSING ${impliedBattles.length} IMPLIED BATTLE TYPES (${totalUpdates} total TrueSkill updates) =====`);

    if (impliedBattles.length === 0) {
      console.log(`🔥 [ENHANCED_REORDER] ⚠️ No implied battles to process`);
      onRankingsUpdate(workingRankings);
      return;
    }

    // Process TrueSkill updates
    let updatedDraggedRating = draggedRating;

    // Process each implied battle with the specified frequency
    impliedBattles.forEach(({ opponent, draggedWins, battleType, frequency }, battleIndex) => {
      console.log(`🔥 [ENHANCED_REORDER] --- Battle Type ${battleIndex + 1}/${impliedBattles.length}: ${battleType} (${frequency}x) ---`);
      
      // Get opponent rating from centralized store - using string ID
      let opponentRating = getRating(opponent.id.toString());

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

      // Update TrueSkill store for opponent - using string ID
      if (preventAutoResorting) {
        console.log(`🔥 [ENHANCED_REORDER] MANUAL MODE: Silently updating TrueSkill store for ${opponent.name} (no sync events)`);
        const store = useTrueSkillStore.getState();
        store.ratings[opponent.id.toString()] = {
          mu: opponentRating.mu,
          sigma: opponentRating.sigma,
          lastUpdated: new Date().toISOString(),
          battleCount: (store.ratings[opponent.id.toString()]?.battleCount || 0) + frequency
        };
      } else {
        console.log(`🔥 [ENHANCED_REORDER] Updating centralized TrueSkill store for ${opponent.name}`);
        updateRating(opponent.id.toString(), opponentRating);
      }
    });

    // Update TrueSkill store for dragged Pokemon - using string ID
    if (preventAutoResorting) {
      console.log(`🔥 [ENHANCED_REORDER] MANUAL MODE: Silently updating TrueSkill store for dragged Pokemon ${draggedPokemon.name} (no sync events)`);
      const store = useTrueSkillStore.getState();
      store.ratings[draggedPokemonId.toString()] = {
        mu: updatedDraggedRating.mu,
        sigma: updatedDraggedRating.sigma,
        lastUpdated: new Date().toISOString(),
        battleCount: (store.ratings[draggedPokemonId.toString()]?.battleCount || 0) + totalUpdates
      };
    } else {
      console.log(`🔥 [ENHANCED_REORDER] Updating centralized TrueSkill store for dragged Pokemon ${draggedPokemon.name}`);
      updateRating(draggedPokemonId.toString(), updatedDraggedRating);
    }

    console.log(`🔥 [ENHANCED_REORDER] ===== RECALCULATING SCORES =====`);

    // Recalculate scores based on updated ratings
    workingRankings.forEach(pokemon => {
      let latestRating: Rating;
      
      if (preventAutoResorting) {
        if (pokemon.id === draggedPokemonId) {
          latestRating = updatedDraggedRating;
        } else {
          const battleAffected = impliedBattles.find(b => b.opponent.id === pokemon.id);
          if (battleAffected) {
            const store = useTrueSkillStore.getState();
            const storedRating = store.ratings[pokemon.id.toString()];
            latestRating = storedRating ? new Rating(storedRating.mu, storedRating.sigma) : getRating(pokemon.id.toString());
          } else {
            latestRating = getRating(pokemon.id.toString());
          }
        }
      } else {
        latestRating = getRating(pokemon.id.toString());
      }
      
      if (latestRating) {
        const oldScore = pokemon.score;
        const conservativeEstimate = latestRating.mu - 3 * latestRating.sigma;
        pokemon.score = conservativeEstimate;
        pokemon.confidence = Math.max(0, Math.min(100, 100 * (1 - (latestRating.sigma / 8.33))));
        pokemon.rating = latestRating;
        
        if (pokemon.id === draggedPokemonId || impliedBattles.some(b => b.opponent.id === pokemon.id)) {
          console.log(`🔥 [ENHANCED_REORDER] Score update - ${pokemon.name}: ${oldScore?.toFixed(3)} → ${pokemon.score.toFixed(3)} (confidence: ${pokemon.confidence.toFixed(1)}%)`);
        }
      }
    });

    // Skip re-sorting if preventAutoResorting is true
    if (preventAutoResorting) {
      console.log(`🔥 [ENHANCED_REORDER] ===== MANUAL MODE: MAINTAINING USER ORDER =====`);
      console.log(`🔥 [ENHANCED_REORDER] Skipping re-sorting to preserve manual positioning`);
    } else {
      console.log(`🔥 [ENHANCED_REORDER] ===== RE-SORTING RANKINGS =====`);
      workingRankings.sort((a, b) => b.score - a.score);
    }

    console.log(`🔥 [ENHANCED_REORDER] ===== STRENGTHENED REORDER COMPLETE =====`);
    console.log(`🔥 [ENHANCED_REORDER] Successfully processed ${totalUpdates} TrueSkill updates for ${draggedPokemon.name} (${impliedBattles.length} battle types)`);

    // Handle events
    if (sourceIndex === -1) {
      console.log(`🔥 [ENHANCED_REORDER] NEW POKEMON: Dispatching insertion event without auto-sync`);
      const insertionEvent = new CustomEvent('pokemon-manually-inserted', {
        detail: { 
          pokemonId: draggedPokemonId,
          insertionPosition: destinationIndex,
          timestamp: Date.now()
        }
      });
      document.dispatchEvent(insertionEvent);
    } else if (!preventAutoResorting) {
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
      ? `Added ${draggedPokemon.name} with strengthened implied battles` 
      : preventAutoResorting 
        ? `Strengthened manual position set for ${draggedPokemon.name}` 
        : `Strengthened ranking update for ${draggedPokemon.name}`;
    
    const feedbackDescription = sourceIndex === -1
      ? `Applied ${totalUpdates} strengthened TrueSkill adjustments based on insertion position`
      : preventAutoResorting
        ? `Position locked at rank ${destinationIndex + 1}, TrueSkill adjusted with ${totalUpdates} updates`
        : `Applied ${totalUpdates} strengthened TrueSkill adjustments with enhanced battle frequencies`;

    toast.success(feedbackMessage, {
      description: feedbackDescription
    });

  }, [finalRankings, pokemonLookupMap, onRankingsUpdate, addImpliedBattle, preventAutoResorting, getRating, updateRating]);

  return { handleEnhancedManualReorder };
};
