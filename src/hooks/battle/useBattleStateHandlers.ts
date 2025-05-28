
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
    
    // Add Pokemon that will be before the new position (if it exists)
    if (destinationIndex > 0) {
      const beforeIndex = destinationIndex - 1;
      const beforePokemon = finalRankings[beforeIndex];
      
      if (beforePokemon && typeof beforePokemon.id === 'number' && beforePokemon.id !== pokemonId) {
        neighborIds.push(beforePokemon.id);
        console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Added neighbor before: ${beforePokemon.name} (${beforePokemon.id})`);
      }
    }
    
    // Add Pokemon that will be after the new position (if it exists)
    if (destinationIndex < finalRankings.length - 1) {
      const afterIndex = destinationIndex + 1;
      const afterPokemon = finalRankings[afterIndex];
      
      if (afterPokemon && typeof afterPokemon.id === 'number' && afterPokemon.id !== pokemonId) {
        neighborIds.push(afterPokemon.id);
        console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Added neighbor after: ${afterPokemon.name} (${afterPokemon.id})`);
      }
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Total neighbors found: ${neighborIds.length}`);
    
    if (neighborIds.length === 0) {
      console.warn(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] No valid neighbors found for validation battles`);
      return;
    }
    
    // Queue refinement battles for this manual reorder
    try {
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] BEFORE QUEUEING - Current queue size: ${refinementQueue.refinementBattleCount}`);
      
      refinementQueue.queueBattlesForReorder(
        pokemonId,
        neighborIds,
        destinationIndex
      );
      
      console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] IMMEDIATELY AFTER QUEUEING - Queue size: ${refinementQueue.refinementBattleCount}`);
      console.log(`✅ [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Successfully queued refinement battles for Pokemon ${pokemonId} (${draggedPokemon.name})`);
      
      // CRITICAL FIX: Dispatch event to force next battle immediately
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
      
      document.dispatchEvent(forceNextBattleEvent);
      console.log(`🚀 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] ✅ Event dispatched successfully`);
      
    } catch (error) {
      console.error(`❌ [MANUAL_REORDER_HANDLER_ULTRA_TRACE] Error queueing refinement battles:`, error);
    }
    
    console.log(`🔄 [MANUAL_REORDER_HANDLER_ULTRA_TRACE] ===== MANUAL REORDER END =====`);
  }, [refinementQueue, finalRankings]);

  // CRITICAL FIX: Enhanced battle completion with proper queue management
  const processBattleResultWithRefinement = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] ===== BATTLE RESULT PROCESSING =====`);
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Selected Pokemon IDs: ${selectedPokemonIds.join(', ')}`);
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Current battle Pokemon: ${currentBattlePokemon.map(p => `${p.name} (${p.id})`).join(', ')}`);
    console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Queue size before processing: ${refinementQueue.refinementBattleCount}`);
    
    // CRITICAL FIX: Check if this was a refinement battle and pop it
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    let wasRefinementBattle = false;
    
    if (nextRefinement) {
      // Check if current battle matches the pending refinement
      const battleIds = currentBattlePokemon.map(p => p.id).sort((a, b) => a - b);
      const refinementIds = [nextRefinement.primaryPokemonId, nextRefinement.opponentPokemonId].sort((a, b) => a - b);
      
      const isMatch = battleIds.length === refinementIds.length && 
                     battleIds.every((id, index) => id === refinementIds[index]);
      
      if (isMatch) {
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] ✅ Confirmed refinement battle completed: ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Reason: ${nextRefinement.reason}`);
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Winner(s): ${selectedPokemonIds.join(', ')}`);
        
        // Pop the completed refinement battle
        refinementQueue.popRefinementBattle();
        wasRefinementBattle = true;
        
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Queue size after popping: ${refinementQueue.refinementBattleCount}`);
        
        // CRITICAL FIX: Apply ranking adjustments based on validation battle results
        if (nextRefinement.reason.includes('manual reorder')) {
          console.log(`🏆 [RANKING_VALIDATION] Processing validation battle result for manual reorder`);
          console.log(`🏆 [RANKING_VALIDATION] Primary Pokemon: ${nextRefinement.primaryPokemonId}, Won: ${selectedPokemonIds.includes(nextRefinement.primaryPokemonId)}`);
          console.log(`🏆 [RANKING_VALIDATION] Opponent Pokemon: ${nextRefinement.opponentPokemonId}, Won: ${selectedPokemonIds.includes(nextRefinement.opponentPokemonId)}`);
          
          // Store validation result for ranking system to use
          const validationResult = {
            primaryPokemonId: nextRefinement.primaryPokemonId,
            opponentPokemonId: nextRefinement.opponentPokemonId,
            primaryWon: selectedPokemonIds.includes(nextRefinement.primaryPokemonId),
            timestamp: Date.now()
          };
          
          // Dispatch validation result event
          const validationEvent = new CustomEvent('validation-battle-completed', {
            detail: validationResult
          });
          document.dispatchEvent(validationEvent);
          
          console.log(`🏆 [RANKING_VALIDATION] Validation result dispatched:`, validationResult);
        }
      } else {
        console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Current battle does not match pending refinement`);
        console.log(`⚔️ [BATTLE_RESULT_PROCESSING] Battle IDs: ${battleIds.join(', ')}, Refinement IDs: ${refinementIds.join(', ')}`);
      }
    } else {
      console.log(`⚔️ [BATTLE_RESULT_PROCESSING] No pending refinement battles`);
    }
    
    if (wasRefinementBattle) {
      console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] ✅ Refinement battle processing complete`);
    } else {
      console.log(`⚔️ [BATTLE_RESULT_PROCESSING] ✅ Regular battle processing`);
    }
    
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
