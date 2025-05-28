
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
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] ===== HANDLE MANUAL REORDER CALLED =====`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Function called with parameters:`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - draggedPokemonId: ${draggedPokemonId}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - sourceIndex: ${sourceIndex}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - destinationIndex: ${destinationIndex}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - finalRankings length: ${finalRankings.length}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - allPokemon length: ${allPokemon.length}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - refinementQueue instance:`, refinementQueue);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - refinementQueue exists: ${!!refinementQueue}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - refinementQueue.queueBattlesForReorder exists: ${typeof refinementQueue?.queueBattlesForReorder === 'function'}`);
    
    // Check if refinement queue is properly initialized
    if (!refinementQueue || typeof refinementQueue.queueBattlesForReorder !== 'function') {
      console.error(`🚨 [MANUAL_REORDER_HANDLER_DEBUG] CRITICAL ERROR: refinementQueue is not properly initialized!`);
      console.error(`🚨 [MANUAL_REORDER_HANDLER_DEBUG] refinementQueue:`, refinementQueue);
      console.error(`🚨 [MANUAL_REORDER_HANDLER_DEBUG] This indicates the component is not wrapped in RefinementQueueProvider!`);
      return;
    }
    
    // Find the dragged Pokemon to log its name
    const draggedPokemon = finalRankings.find(p => p.id === draggedPokemonId);
    if (draggedPokemon) {
      console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Dragged Pokemon: ${draggedPokemon.name}`);
    } else {
      console.error(`🚨 [MANUAL_REORDER_HANDLER_DEBUG] Could not find dragged Pokemon ${draggedPokemonId} in finalRankings!`);
      console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] finalRankings sample:`, finalRankings.slice(0, 5).map(p => ({ id: p.id, name: p.name })));
      return; // Exit early if Pokemon not found
    }
    
    // Calculate neighbor Pokemon IDs for validation battles
    const neighbors: number[] = [];
    const rankings = finalRankings || [];
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Calculating neighbors for position ${destinationIndex + 1}...`);
    
    // Add Pokemon above and below the new position for thorough validation
    const positions = [
      destinationIndex - 2, // Two above
      destinationIndex - 1, // One above
      destinationIndex + 1, // One below
      destinationIndex + 2  // Two below
    ];
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Checking positions: ${positions.join(', ')}`);
    
    positions.forEach(pos => {
      if (pos >= 0 && pos < rankings.length && rankings[pos] && rankings[pos].id !== draggedPokemonId) {
        neighbors.push(rankings[pos].id);
        console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Added neighbor at position ${pos + 1}: ${rankings[pos].name} (${rankings[pos].id})`);
      } else {
        const reason = pos < 0 ? 'negative position' : 
                     pos >= rankings.length ? 'out of bounds' : 
                     !rankings[pos] ? 'no Pokemon at position' :
                     rankings[pos].id === draggedPokemonId ? 'same as dragged Pokemon' : 'unknown';
        console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Skipped position ${pos + 1}: ${reason}`);
      }
    });
    
    // Ensure we have at least some validation battles
    if (neighbors.length === 0 && rankings.length > 1) {
      console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] No neighbors found, adding fallback neighbors...`);
      for (let i = Math.max(0, destinationIndex - 3); i <= Math.min(rankings.length - 1, destinationIndex + 3); i++) {
        if (rankings[i] && rankings[i].id !== draggedPokemonId && neighbors.length < 3) {
          neighbors.push(rankings[i].id);
          console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Added fallback neighbor: ${rankings[i].name} (${rankings[i].id})`);
        }
      }
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Final neighbors list: [${neighbors.join(', ')}]`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Total neighbors: ${neighbors.length}`);
    
    if (neighbors.length === 0) {
      console.warn(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] ⚠️ No neighbors found for validation battles!`);
      return;
    }
    
    // Queue refinement battles - THIS IS THE CRITICAL STEP
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] ===== QUEUEING REFINEMENT BATTLES =====`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] About to call queueBattlesForReorder with:`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - Primary Pokemon ID: ${draggedPokemonId}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - Neighbors: [${neighbors.join(', ')}]`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] - New position: ${destinationIndex + 1}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Current refinement queue before queueing: ${refinementQueue.refinementBattleCount} battles`);
    
    try {
      refinementQueue.queueBattlesForReorder(draggedPokemonId, neighbors, destinationIndex + 1);
      console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] ✅ queueBattlesForReorder called successfully`);
      console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] Refinement queue after queueing: ${refinementQueue.refinementBattleCount} battles`);
    } catch (error) {
      console.error(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] ❌ Error calling queueBattlesForReorder:`, error);
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] ===== END QUEUEING REFINEMENT BATTLES =====`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_DEBUG] ===== END HANDLE MANUAL REORDER =====`);
  }, [finalRankings, refinementQueue]);

  // Handle battle completion to pop refinement battles from queue
  const processBattleResultWithRefinement = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] ===== BATTLE RESULT PROCESSING =====`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Selected Pokemon IDs: ${selectedPokemonIds.join(', ')}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Current battle Pokemon: ${currentBattlePokemon.map(p => `${p.name} (${p.id})`).join(', ')}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Battle type: ${battleType}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Refinement queue instance:`, refinementQueue);
    console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Has refinement battles: ${refinementQueue?.hasRefinementBattles}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Refinement queue count: ${refinementQueue?.refinementBattleCount}`);
    console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Current refinement queue:`, refinementQueue?.refinementQueue);
    
    // Check if this was a refinement battle before processing
    if (refinementQueue?.hasRefinementBattles && currentBattlePokemon.length === 2) {
      const currentRefinement = refinementQueue.getNextRefinementBattle();
      
      if (currentRefinement) {
        const battlePokemonIds = currentBattlePokemon.map(p => p.id).sort((a, b) => a - b);
        const refinementIds = [currentRefinement.primaryPokemonId, currentRefinement.opponentPokemonId].sort((a, b) => a - b);
        
        console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Battle Pokemon IDs (sorted): [${battlePokemonIds.join(', ')}]`);
        console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Expected refinement IDs (sorted): [${refinementIds.join(', ')}]`);
        console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Refinement reason: ${currentRefinement.reason}`);
        
        // Check if this battle matches the current refinement battle
        if (battlePokemonIds[0] === refinementIds[0] && battlePokemonIds[1] === refinementIds[1]) {
          console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] ✅ MATCH! This was a refinement battle - popping from queue`);
          console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Queue before pop: ${refinementQueue.refinementBattleCount}`);
          refinementQueue.popRefinementBattle();
          console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Queue after pop: ${refinementQueue.refinementBattleCount}`);
          console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] Remaining battles: ${refinementQueue.refinementBattleCount}`);
        } else {
          console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] ❌ NO MATCH - Battle IDs don't match refinement battle`);
          console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] This was likely a regular battle, not popping from queue`);
        }
      } else {
        console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] ❌ No current refinement battle found in queue`);
      }
    } else {
      console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] ❌ Not a refinement battle`);
      console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] - Has refinements: ${refinementQueue?.hasRefinementBattles}`);
      console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] - Battle length: ${currentBattlePokemon.length} (expected 2 for refinement)`);
    }
    
    console.log(`⚔️ [REFINEMENT_COMPLETION_CONTEXT_DEBUG] ===== END BATTLE RESULT PROCESSING =====`);
    
    // Call original battle processing
    return originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
  }, [originalProcessBattleResult, refinementQueue]);

  return {
    handleManualReorder,
    processBattleResultWithRefinement,
    pendingRefinements: new Set(refinementQueue?.refinementQueue?.map(b => b.primaryPokemonId) || []),
    refinementBattleCount: refinementQueue?.refinementBattleCount || 0,
    clearRefinementQueue: refinementQueue?.clearRefinementQueue || (() => {})
  };
};
