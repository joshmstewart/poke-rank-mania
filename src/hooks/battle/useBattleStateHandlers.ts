
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStateHandlers = (
  allPokemon: Pokemon[],
  originalProcessBattleResult: any,
  finalRankings: any[]
) => {
  const refinementQueue = useSharedRefinementQueue();

  // Handle manual reordering
  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ===== DRAG AND DROP OPERATION =====`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Pokemon ID: ${draggedPokemonId}`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Source position: ${sourceIndex + 1}`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Destination position: ${destinationIndex + 1}`);
    
    // Find the dragged Pokemon to log its name
    const draggedPokemon = finalRankings.find(p => p.id === draggedPokemonId);
    if (draggedPokemon) {
      console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Pokemon name: ${draggedPokemon.name}`);
    } else {
      console.error(`🚨 [MANUAL_REORDER_ULTRA_DEBUG] Could not find dragged Pokemon ${draggedPokemonId} in finalRankings!`);
      console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] finalRankings length: ${finalRankings.length}`);
      console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] First 5 Pokemon IDs in rankings:`, finalRankings.slice(0, 5).map(p => p.id));
    }
    
    // Calculate neighbor Pokemon IDs for validation battles
    const neighbors: number[] = [];
    const rankings = finalRankings || [];
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Total rankings available: ${rankings.length}`);
    
    // Add Pokemon above and below the new position for thorough validation
    const positions = [
      destinationIndex - 2, // Two above
      destinationIndex - 1, // One above
      destinationIndex + 1, // One below
      destinationIndex + 2  // Two below
    ];
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Checking positions for neighbors: ${positions.join(', ')}`);
    
    positions.forEach(pos => {
      if (pos >= 0 && pos < rankings.length && rankings[pos] && rankings[pos].id !== draggedPokemonId) {
        neighbors.push(rankings[pos].id);
        console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Added neighbor at position ${pos + 1}: ${rankings[pos].name} (${rankings[pos].id})`);
      } else {
        console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Skipped position ${pos + 1}: ${pos < 0 ? 'negative' : pos >= rankings.length ? 'out of bounds' : rankings[pos]?.id === draggedPokemonId ? 'same as dragged' : 'invalid'}`);
      }
    });
    
    // Ensure we have at least some validation battles
    if (neighbors.length === 0 && rankings.length > 1) {
      console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] No neighbors found, adding fallback neighbors...`);
      // Fallback: add some nearby Pokemon
      for (let i = Math.max(0, destinationIndex - 3); i <= Math.min(rankings.length - 1, destinationIndex + 3); i++) {
        if (rankings[i] && rankings[i].id !== draggedPokemonId && neighbors.length < 3) {
          neighbors.push(rankings[i].id);
          console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Added fallback neighbor: ${rankings[i].name} (${rankings[i].id})`);
        }
      }
    }
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Final neighbors list: ${neighbors.join(', ')}`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Total neighbors: ${neighbors.length}`);
    
    // Queue refinement battles - this is where the drag action creates future battles
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Queueing validation battles...`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Refinement queue before queueing: ${refinementQueue.refinementBattleCount} battles`);
    
    refinementQueue.queueBattlesForReorder(draggedPokemonId, neighbors, destinationIndex + 1);
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ✅ Successfully queued ${neighbors.length} validation battles`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Total refinement battles in queue AFTER queueing: ${refinementQueue.refinementBattleCount}`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Current refinement queue state:`, refinementQueue.refinementQueue);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ===== END DRAG AND DROP OPERATION =====`);
  }, [finalRankings, refinementQueue]);

  // Handle battle completion to pop refinement battles from queue
  const processBattleResultWithRefinement = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] ===== BATTLE RESULT PROCESSING =====`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Selected Pokemon IDs: ${selectedPokemonIds.join(', ')}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Current battle Pokemon: ${currentBattlePokemon.map(p => `${p.name} (${p.id})`).join(', ')}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Battle type: ${battleType}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Has refinement battles: ${refinementQueue.hasRefinementBattles}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Refinement queue count: ${refinementQueue.refinementBattleCount}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Current refinement queue:`, refinementQueue.refinementQueue);
    
    // Check if this was a refinement battle before processing
    if (refinementQueue.hasRefinementBattles && currentBattlePokemon.length === 2) {
      const currentRefinement = refinementQueue.getNextRefinementBattle();
      
      if (currentRefinement) {
        const battlePokemonIds = currentBattlePokemon.map(p => p.id).sort((a, b) => a - b);
        const refinementIds = [currentRefinement.primaryPokemonId, currentRefinement.opponentPokemonId].sort((a, b) => a - b);
        
        console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Battle Pokemon IDs (sorted): [${battlePokemonIds.join(', ')}]`);
        console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Expected refinement IDs (sorted): [${refinementIds.join(', ')}]`);
        console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Refinement reason: ${currentRefinement.reason}`);
        
        // Check if this battle matches the current refinement battle
        if (battlePokemonIds[0] === refinementIds[0] && battlePokemonIds[1] === refinementIds[1]) {
          console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] ✅ MATCH! This was a refinement battle - popping from queue`);
          console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Queue before pop: ${refinementQueue.refinementBattleCount}`);
          refinementQueue.popRefinementBattle();
          console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Queue after pop: ${refinementQueue.refinementBattleCount}`);
          console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] Remaining battles: ${refinementQueue.refinementBattleCount}`);
        } else {
          console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] ❌ NO MATCH - Battle IDs don't match refinement battle`);
          console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] This was likely a regular battle, not popping from queue`);
        }
      } else {
        console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] ❌ No current refinement battle found in queue`);
      }
    } else {
      console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] ❌ Not a refinement battle`);
      console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] - Has refinements: ${refinementQueue.hasRefinementBattles}`);
      console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] - Battle length: ${currentBattlePokemon.length} (expected 2 for refinement)`);
    }
    
    console.log(`⚔️ [REFINEMENT_COMPLETION_ULTRA_DEBUG] ===== END BATTLE RESULT PROCESSING =====`);
    
    // Call original battle processing
    return originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
  }, [originalProcessBattleResult, refinementQueue]);

  return {
    handleManualReorder,
    processBattleResultWithRefinement,
    pendingRefinements: new Set(refinementQueue.refinementQueue.map(b => b.primaryPokemonId)),
    refinementBattleCount: refinementQueue.refinementBattleCount,
    clearRefinementQueue: refinementQueue.clearRefinementQueue
  };
};
