
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
    
    // Get the dragged Pokemon info
    const draggedPokemon = finalRankings.find(p => p.id === pokemonId);
    if (!draggedPokemon) {
      console.error(`🔄 [MANUAL_REORDER_HANDLER] Could not find dragged Pokemon ${pokemonId} in rankings`);
      return;
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Found dragged Pokemon: ${draggedPokemon.name} (${draggedPokemon.id})`);
    
    // Get neighboring Pokemon IDs around the NEW position for validation battles
    const neighborIds: number[] = [];
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER] Looking for neighbors around destination index ${destinationIndex}`);
    
    // Add Pokemon that will be before the new position (if it exists)
    if (destinationIndex > 0) {
      const beforeIndex = destinationIndex - 1;
      const beforePokemon = finalRankings[beforeIndex];
      
      console.log(`🔄 [MANUAL_REORDER_HANDLER] Checking before position at index ${beforeIndex}:`, beforePokemon?.name, beforePokemon?.id);
      
      if (beforePokemon && typeof beforePokemon.id === 'number' && beforePokemon.id !== pokemonId) {
        neighborIds.push(beforePokemon.id);
        console.log(`🔄 [MANUAL_REORDER_HANDLER] Added neighbor before: ${beforePokemon.name} (${beforePokemon.id})`);
      }
    }
    
    // Add Pokemon that will be after the new position (if it exists)
    if (destinationIndex < finalRankings.length - 1) {
      const afterIndex = destinationIndex + 1;
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
    
    // Queue refinement battles for this manual reorder
    try {
      console.log(`🔄 [MANUAL_REORDER_HANDLER] About to queue battles - refinement queue exists:`, !!refinementQueue);
      console.log(`🔄 [MANUAL_REORDER_HANDLER] queueBattlesForReorder function exists:`, typeof refinementQueue.queueBattlesForReorder);
      
      console.log(`🔄 [MANUAL_REORDER_HANDLER] BEFORE QUEUEING - Current queue size: ${refinementQueue.refinementBattleCount}`);
      console.log(`🔄 [MANUAL_REORDER_HANDLER] BEFORE QUEUEING - Current queue:`, refinementQueue.refinementQueue);
      
      refinementQueue.queueBattlesForReorder(
        pokemonId,
        neighborIds,
        destinationIndex
      );
      
      // CRITICAL: Wait a bit for queue to update, then check
      setTimeout(() => {
        console.log(`🔄 [MANUAL_REORDER_HANDLER] AFTER QUEUEING - Queue size: ${refinementQueue.refinementBattleCount}`);
        console.log(`🔄 [MANUAL_REORDER_HANDLER] AFTER QUEUEING - Queue contents:`, refinementQueue.refinementQueue);
        console.log(`🔄 [MANUAL_REORDER_HANDLER] AFTER QUEUEING - Has refinement battles: ${refinementQueue.hasRefinementBattles}`);
        console.log(`🔄 [MANUAL_REORDER_HANDLER] AFTER QUEUEING - Next battle:`, refinementQueue.getNextRefinementBattle());
        
        console.log(`✅ [MANUAL_REORDER_HANDLER] Successfully queued refinement battles for Pokemon ${pokemonId} (${draggedPokemon.name})`);
        console.log(`📊 [MANUAL_REORDER_HANDLER] Total refinement battles in queue: ${refinementQueue.refinementBattleCount}`);
        console.log(`🎯 [MANUAL_REORDER_HANDLER] Next battle should be a refinement battle involving ${draggedPokemon.name}`);
        
        // Force next battle to check refinement queue
        console.log(`🚀 [MANUAL_REORDER_HANDLER] Triggering force next battle to use refinement queue`);
        const forceNextBattleEvent = new CustomEvent('force-next-battle', {
          detail: { 
            reason: 'manual_reorder',
            pokemonId: pokemonId,
            pokemonName: draggedPokemon.name,
            immediate: true,
            queueSize: refinementQueue.refinementBattleCount,
            timestamp: Date.now()
          }
        });
        document.dispatchEvent(forceNextBattleEvent);
      }, 100); // Small delay to ensure state updates
      
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
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Queue size before processing: ${refinementQueue.refinementBattleCount}`);
    
    // Check if this was a refinement battle
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    if (nextRefinement && 
        currentBattlePokemon.some(p => p.id === nextRefinement.primaryPokemonId) &&
        currentBattlePokemon.some(p => p.id === nextRefinement.opponentPokemonId)) {
      console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Completed refinement battle for Pokemon ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Reason: ${nextRefinement.reason}`);
      // Pop the completed refinement battle
      refinementQueue.popRefinementBattle();
      console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Queue size after popping: ${refinementQueue.refinementBattleCount}`);
    } else {
      console.log(`⚔️ [BATTLE_RESULT_PROCESSING] This was NOT a refinement battle`);
      if (nextRefinement) {
        console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Next refinement exists but doesn't match current battle:`, nextRefinement);
      }
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
