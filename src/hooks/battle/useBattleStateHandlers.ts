
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
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER START =====`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Raw draggedPokemonId:`, draggedPokemonId, typeof draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Pokemon moved from ${sourceIndex} to ${destinationIndex}`);
    
    // Convert to proper number type
    const pokemonId = typeof draggedPokemonId === 'string' ? parseInt(draggedPokemonId, 10) : Number(draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Converted Pokemon ID: ${pokemonId} (type: ${typeof pokemonId})`);
    
    if (isNaN(pokemonId)) {
      console.error(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Invalid Pokemon ID: ${draggedPokemonId}`);
      return;
    }
    
    // Get the dragged Pokemon info
    const draggedPokemon = finalRankings.find(p => p.id === pokemonId);
    if (!draggedPokemon) {
      console.error(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Could not find dragged Pokemon ${pokemonId} in rankings`);
      return;
    }
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Found dragged Pokemon: ${draggedPokemon.name} (${draggedPokemon.id})`);
    
    // Get neighboring Pokemon IDs around the NEW position for validation battles
    const neighborIds: number[] = [];
    
    // Add Pokemon that will be before the new position (if it exists)
    if (destinationIndex > 0) {
      const beforeIndex = destinationIndex - 1;
      const beforePokemon = finalRankings[beforeIndex];
      
      if (beforePokemon && typeof beforePokemon.id === 'number' && beforePokemon.id !== pokemonId) {
        neighborIds.push(beforePokemon.id);
        console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Added neighbor before: ${beforePokemon.name} (${beforePokemon.id})`);
      }
    }
    
    // Add Pokemon that will be after the new position (if it exists)
    if (destinationIndex < finalRankings.length - 1) {
      const afterIndex = destinationIndex + 1;
      const afterPokemon = finalRankings[afterIndex];
      
      if (afterPokemon && typeof afterPokemon.id === 'number' && afterPokemon.id !== pokemonId) {
        neighborIds.push(afterPokemon.id);
        console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Added neighbor after: ${afterPokemon.name} (${afterPokemon.id})`);
      }
    }
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Total neighbors found: ${neighborIds.length}`);
    
    if (neighborIds.length === 0) {
      console.warn(`🔄 [MANUAL_REORDER_ULTRA_TRACE] No valid neighbors found for validation battles`);
      return;
    }
    
    // Queue refinement battles for this manual reorder
    try {
      console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] CALLING queueBattlesForReorder with:`, {
        pokemonId,
        neighborIds,
        destinationIndex,
        queueSizeBefore: refinementQueue.refinementBattleCount
      });
      
      refinementQueue.queueBattlesForReorder(
        pokemonId,
        neighborIds,
        destinationIndex
      );
      
      console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] IMMEDIATE QUEUE CHECK - Queue size: ${refinementQueue.refinementBattleCount}`);
      console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] IMMEDIATE QUEUE CHECK - Queue contents:`, refinementQueue.refinementQueue);
      
      // CRITICAL FIX: Dispatch event immediately without setTimeout
      console.log(`✅ [MANUAL_REORDER_ULTRA_TRACE] Successfully queued refinement battles for Pokemon ${pokemonId} (${draggedPokemon.name})`);
      
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
      console.log(`🚀 [MANUAL_REORDER_ULTRA_TRACE] ✅ Event dispatched successfully`);
      
    } catch (error) {
      console.error(`❌ [MANUAL_REORDER_ULTRA_TRACE] Error queueing refinement battles:`, error);
    }
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER END =====`);
  }, [refinementQueue, finalRankings]);

  // CRITICAL FIX: Enhanced battle completion with proper queue management and comprehensive logging
  const processBattleResultWithRefinement = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] ===== BATTLE RESULT PROCESSING START =====`);
    console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] Selected Pokemon IDs: ${selectedPokemonIds.join(', ')}`);
    console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] Current battle Pokemon: ${currentBattlePokemon.map(p => `${p.name} (${p.id})`).join(', ')}`);
    console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] Queue size before processing: ${refinementQueue.refinementBattleCount}`);
    console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] Queue contents before:`, refinementQueue.refinementQueue.map(r => `${r.primaryPokemonId} vs ${r.opponentPokemonId}`));
    
    // CRITICAL FIX: Check if this was a refinement battle and handle it properly
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    let wasRefinementBattle = false;
    let refinementBattleInfo = null;
    
    if (nextRefinement) {
      console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] Found pending refinement: ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      
      // Check if current battle matches the pending refinement
      const battleIds = currentBattlePokemon.map(p => p.id).sort((a, b) => a - b);
      const refinementIds = [nextRefinement.primaryPokemonId, nextRefinement.opponentPokemonId].sort((a, b) => a - b);
      
      const isMatch = battleIds.length === refinementIds.length && 
                     battleIds.every((id, index) => id === refinementIds[index]);
      
      console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] Battle IDs: [${battleIds.join(', ')}]`);
      console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] Refinement IDs: [${refinementIds.join(', ')}]`);
      console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] IDs match: ${isMatch}`);
      
      if (isMatch) {
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] ✅ CONFIRMED refinement battle completed`);
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Primary: ${nextRefinement.primaryPokemonId}, Opponent: ${nextRefinement.opponentPokemonId}`);
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Reason: ${nextRefinement.reason}`);
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Winner(s): ${selectedPokemonIds.join(', ')}`);
        
        wasRefinementBattle = true;
        refinementBattleInfo = { ...nextRefinement };
        
        // CRITICAL FIX: Apply ranking adjustments based on validation battle results
        if (nextRefinement.reason.includes('manual reorder')) {
          console.log(`🏆 [RANKING_VALIDATION_ULTRA_DEBUG] Processing validation battle result for manual reorder`);
          console.log(`🏆 [RANKING_VALIDATION_ULTRA_DEBUG] Primary Pokemon: ${nextRefinement.primaryPokemonId}, Won: ${selectedPokemonIds.includes(nextRefinement.primaryPokemonId)}`);
          console.log(`🏆 [RANKING_VALIDATION_ULTRA_DEBUG] Opponent Pokemon: ${nextRefinement.opponentPokemonId}, Won: ${selectedPokemonIds.includes(nextRefinement.opponentPokemonId)}`);
          
          // Store validation result for ranking system to use
          const validationResult = {
            primaryPokemonId: nextRefinement.primaryPokemonId,
            opponentPokemonId: nextRefinement.opponentPokemonId,
            primaryWon: selectedPokemonIds.includes(nextRefinement.primaryPokemonId),
            timestamp: Date.now(),
            battleDetails: {
              battleIds: battleIds,
              selectedIds: selectedPokemonIds,
              reason: nextRefinement.reason
            }
          };
          
          console.log(`🏆 [RANKING_VALIDATION_ULTRA_DEBUG] Dispatching validation result:`, validationResult);
          
          // Dispatch validation result event
          const validationEvent = new CustomEvent('validation-battle-completed', {
            detail: validationResult
          });
          document.dispatchEvent(validationEvent);
          
          console.log(`🏆 [RANKING_VALIDATION_ULTRA_DEBUG] ✅ Validation result event dispatched successfully`);
        }
        
        // CRITICAL FIX: Pop the completed refinement battle and immediately handle next steps
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Processing completed refinement battle...`);
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Queue size BEFORE pop: ${refinementQueue.refinementBattleCount}`);
        
        // Pop the completed battle
        refinementQueue.popRefinementBattle();
        
        // CRITICAL DEBUG: Log state immediately after pop
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Queue size IMMEDIATELY AFTER pop: ${refinementQueue.refinementBattleCount}`);
        console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Remaining queue contents IMMEDIATELY AFTER pop:`, refinementQueue.refinementQueue.map(r => `${r.primaryPokemonId} vs ${r.opponentPokemonId}`));
        
        // CRITICAL FIX: Do NOT automatically trigger the next battle here
        // Let the normal battle flow handle it to prevent double-battles
        const nextAfterPop = refinementQueue.getNextRefinementBattle();
        if (nextAfterPop) {
          console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] ✅ More refinement battles exist: ${nextAfterPop.primaryPokemonId} vs ${nextAfterPop.opponentPokemonId}`);
          console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] ⚠️ NOT dispatching immediate event - letting normal flow handle it`);
        } else {
          console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] ✅ No more refinement battles - queue is empty`);
        }
        
      } else {
        console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] Current battle does NOT match pending refinement`);
        console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] This is a regular battle, not a refinement battle`);
      }
    } else {
      console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] No pending refinement battles in queue`);
    }
    
    if (wasRefinementBattle) {
      console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] ✅ Refinement battle processing complete for:`, refinementBattleInfo);
      console.log(`⚔️ [REFINEMENT_BATTLE_COMPLETED] Final queue size: ${refinementQueue.refinementBattleCount}`);
    } else {
      console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] ✅ Regular battle processing - no refinement queue changes needed`);
    }
    
    console.log(`⚔️ [BATTLE_RESULT_ULTRA_DEBUG] ===== BATTLE RESULT PROCESSING END =====`);
    
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
