
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
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] ===== MANUAL REORDER START =====`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Raw draggedPokemonId:`, draggedPokemonId, typeof draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Pokemon moved from ${sourceIndex} to ${destinationIndex}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Final rankings length: ${finalRankings.length}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Refinement queue exists:`, !!refinementQueue);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] queueBattlesForReorder exists:`, typeof refinementQueue?.queueBattlesForReorder);
    
    // Convert to proper number type
    const pokemonId = typeof draggedPokemonId === 'string' ? parseInt(draggedPokemonId, 10) : Number(draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Converted Pokemon ID: ${pokemonId} (type: ${typeof pokemonId})`);
    
    if (isNaN(pokemonId)) {
      console.error(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Invalid Pokemon ID: ${draggedPokemonId}`);
      return;
    }
    
    // Get the dragged Pokemon info
    const draggedPokemon = finalRankings.find(p => p.id === pokemonId);
    if (!draggedPokemon) {
      console.error(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Could not find dragged Pokemon ${pokemonId} in rankings`);
      return;
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Found dragged Pokemon: ${draggedPokemon.name} (${draggedPokemon.id})`);
    
    // Get neighboring Pokemon IDs around the NEW position for validation battles
    const neighborIds: number[] = [];
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Looking for neighbors around destination index ${destinationIndex}`);
    
    // Add Pokemon that will be before the new position (if it exists)
    if (destinationIndex > 0) {
      const beforeIndex = destinationIndex - 1;
      const beforePokemon = finalRankings[beforeIndex];
      
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Checking before position at index ${beforeIndex}:`, beforePokemon?.name, beforePokemon?.id);
      
      if (beforePokemon && typeof beforePokemon.id === 'number' && beforePokemon.id !== pokemonId) {
        neighborIds.push(beforePokemon.id);
        console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Added neighbor before: ${beforePokemon.name} (${beforePokemon.id})`);
      }
    }
    
    // Add Pokemon that will be after the new position (if it exists)
    if (destinationIndex < finalRankings.length - 1) {
      const afterIndex = destinationIndex + 1;
      const afterPokemon = finalRankings[afterIndex];
      
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Checking after position at index ${afterIndex}:`, afterPokemon?.name, afterPokemon?.id);
      
      if (afterPokemon && typeof afterPokemon.id === 'number' && afterPokemon.id !== pokemonId) {
        neighborIds.push(afterPokemon.id);
        console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Added neighbor after: ${afterPokemon.name} (${afterPokemon.id})`);
      }
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Total neighbors found: ${neighborIds.length}`);
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Neighbor IDs: ${neighborIds.join(', ')}`);
    
    if (neighborIds.length === 0) {
      console.warn(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] No valid neighbors found for validation battles`);
      return;
    }
    
    // Queue refinement battles for this manual reorder
    try {
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] BEFORE QUEUEING - Current queue size: ${refinementQueue.refinementBattleCount}`);
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] BEFORE QUEUEING - Current queue:`, refinementQueue.refinementQueue);
      
      refinementQueue.queueBattlesForReorder(
        pokemonId,
        neighborIds,
        destinationIndex
      );
      
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] IMMEDIATELY AFTER QUEUEING - Queue size: ${refinementQueue.refinementBattleCount}`);
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] IMMEDIATELY AFTER QUEUEING - Queue contents:`, refinementQueue.refinementQueue);
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] IMMEDIATELY AFTER QUEUEING - Has refinement battles: ${refinementQueue.hasRefinementBattles}`);
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] IMMEDIATELY AFTER QUEUEING - Next battle:`, refinementQueue.getNextRefinementBattle());
      
      console.log(`✅ [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Successfully queued refinement battles for Pokemon ${pokemonId} (${draggedPokemon.name})`);
      console.log(`📊 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Total refinement battles in queue: ${refinementQueue.refinementBattleCount}`);
      console.log(`🎯 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Next battle should be a refinement battle involving ${draggedPokemon.name}`);
      
      // CRITICAL TRACE: Add comprehensive event dispatching logs
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] ===== DISPATCHING FORCE NEXT BATTLE EVENT =====`);
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Pokemon ID for event: ${pokemonId}`);
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Pokemon name for event: ${draggedPokemon.name}`);
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Queue size for event: ${refinementQueue.refinementBattleCount}`);
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Timestamp for event: ${Date.now()}`);
      
      const forceNextBattleEvent = new CustomEvent('force-next-battle', {
        detail: { 
          reason: 'manual_reorder',
          pokemonId: pokemonId,
          pokemonName: draggedPokemon.name,
          immediate: true,
          queueSize: refinementQueue.refinementBattleCount,
          timestamp: Date.now(),
          expectedInBattle: true,
          neighbors: neighborIds,
          destinationIndex: destinationIndex
        }
      });
      
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Event detail object:`, forceNextBattleEvent.detail);
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] About to dispatch event...`);
      
      // CRITICAL: Dispatch immediately without any delay
      document.dispatchEvent(forceNextBattleEvent);
      
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] ✅ Event dispatched successfully`);
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Event should be handled by useBattleSelectionState`);
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Next battle should feature ${draggedPokemon.name} vs one of: ${neighborIds.map(id => finalRankings.find(p => p.id === id)?.name || id).join(', ')}`);
      
    } catch (error) {
      console.error(`❌ [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Error queueing refinement battles:`, error);
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] ===== MANUAL REORDER END =====`);
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
