
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStateHandlers = (
  allPokemon: Pokemon[],
  originalProcessBattleResult: any,
  finalRankings: any[]
) => {
  // Use the shared refinement queue
  const refinementQueue = useSharedRefinementQueue();

  // Handle manual reordering by generating refinement battles
  const handleManualReorder = useCallback((
    draggedPokemonId: number, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    console.log(`🔄 [MANUAL_REORDER_HANDLER] ===== MANUAL REORDER START =====`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Raw draggedPokemonId:`, draggedPokemonId, typeof draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Pokemon moved from ${sourceIndex} to ${destinationIndex}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Final rankings length: ${finalRankings.length}`);
    
    // Convert to proper number type
    const pokemonId = typeof draggedPokemonId === 'string' ? parseInt(draggedPokemonId, 10) : Number(draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Converted Pokemon ID: ${pokemonId} (type: ${typeof pokemonId})`);
    
    if (isNaN(pokemonId)) {
      console.error(`🔄 [MANUAL_REORDER_HANDLER] Invalid Pokemon ID: ${draggedPokemonId}`);
      return;
    }
    
    // Get neighboring Pokemon IDs around the NEW position for validation battles
    // We need to simulate where the Pokemon would be after the move
    const neighborIds: number[] = [];
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Looking for neighbors around destination index ${destinationIndex}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Final rankings sample:`, finalRankings.slice(Math.max(0, destinationIndex - 2), destinationIndex + 3).map(p => ({ id: p?.id, name: p?.name })));
    
    // Add Pokemon that will be before the new position (if it exists)
    if (destinationIndex > 0) {
      // If we're moving down, the "before" position is at destinationIndex - 1
      // If we're moving up, we need to account for the shift
      const beforeIndex = sourceIndex < destinationIndex ? destinationIndex - 1 : destinationIndex - 1;
      const beforePokemon = finalRankings[beforeIndex];
      
      console.log(`🔄 [MANUAL_REORDER_HANDLER] Checking before position at index ${beforeIndex}:`, beforePokemon?.name, beforePokemon?.id);
      
      if (beforePokemon && typeof beforePokemon.id === 'number' && beforePokemon.id !== pokemonId) {
        neighborIds.push(beforePokemon.id);
        console.log(`🔄 [MANUAL_REORDER_HANDLER] Added neighbor before: ${beforePokemon.name} (${beforePokemon.id})`);
      }
    }
    
    // Add Pokemon that will be after the new position (if it exists)
    if (destinationIndex < finalRankings.length - 1) {
      // If we're moving up, the "after" position is at destinationIndex + 1
      // If we're moving down, we need to account for the shift
      const afterIndex = sourceIndex < destinationIndex ? destinationIndex + 1 : destinationIndex + 1;
      const afterPokemon = finalRankings[afterIndex];
      
      console.log(`🔄 [MANUAL_REORDER_HANDLER] Checking after position at index ${afterIndex}:`, afterPokemon?.name, afterPokemon?.id);
      
      if (afterPokemon && typeof afterPokemon.id === 'number' && afterPokemon.id !== pokemonId) {
        neighborIds.push(afterPokemon.id);
        console.log(`🔄 [MANUAL_REORDER_HANDLER] Added neighbor after: ${afterPokemon.name} (${afterPokemon.id})`);
      }
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Total neighbors found: ${neighborIds.length}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Neighbor IDs: ${neighborIds.join(', ')}`);
    
    if (neighborIds.length === 0) {
      console.warn(`🔄 [MANUAL_REORDER_HANDLER] No valid neighbors found for validation battles`);
      return;
    }
    
    // Ensure all parameters are the correct types
    const validNeighbors = neighborIds.filter(id => typeof id === 'number' && !isNaN(id));
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Final call parameters:`, {
      pokemonId,
      validNeighbors,
      destinationIndex,
      refinementQueueExists: !!refinementQueue,
      queueBattlesForReorderExists: typeof refinementQueue.queueBattlesForReorder === 'function'
    });
    
    if (validNeighbors.length === 0) {
      console.warn(`🔄 [MANUAL_REORDER_HANDLER] No valid neighbors after filtering`);
      return;
    }
    
    // Queue refinement battles for this manual reorder
    try {
      refinementQueue.queueBattlesForReorder(
        pokemonId,
        validNeighbors,
        destinationIndex
      );
      
      console.log(`✅ [MANUAL_REORDER_HANDLER] Successfully queued refinement battles for Pokemon ${pokemonId}`);
      console.log(`📊 [MANUAL_REORDER_HANDLER] Total refinement battles in queue: ${refinementQueue.refinementBattleCount}`);
    } catch (error) {
      console.error(`❌ [MANUAL_REORDER_HANDLER] Error queueing refinement battles:`, error);
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER] ===== MANUAL REORDER END =====`);
  }, [refinementQueue, finalRankings]);

  // Handle battle completion - enhanced with refinement processing
  const processBattleResultWithRefinement = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] ===== BATTLE RESULT PROCESSING =====`);
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Selected Pokemon IDs: ${selectedPokemonIds.join(', ')}`);
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Current battle Pokemon: ${currentBattlePokemon.map(p => `${p.name} (${p.id})`).join(', ')}`);
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Battle type: ${battleType}`);
    
    // Check if this was a refinement battle
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    if (nextRefinement && 
        currentBattlePokemon.some(p => p.id === nextRefinement.primaryPokemonId) &&
        currentBattlePokemon.some(p => p.id === nextRefinement.opponentPokemonId)) {
      console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Completed refinement battle for Pokemon ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      // Pop the completed refinement battle
      refinementQueue.popRefinementBattle();
    }
    
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] ===== END BATTLE RESULT PROCESSING =====`);
    
    // Call original battle processing
    return originalProcessBattleResult(selectedPokemonIds, currentBattlePokemon, battleType, selectedGeneration);
  }, [originalProcessBattleResult, refinementQueue]);

  return {
    processBattleResultWithRefinement,
    handleManualReorder,
    pendingRefinements: new Set(refinementQueue.refinementQueue.map(r => r.primaryPokemonId)),
    refinementBattleCount: refinementQueue.refinementBattleCount,
    clearRefinementQueue: refinementQueue.clearRefinementQueue
  };
};
