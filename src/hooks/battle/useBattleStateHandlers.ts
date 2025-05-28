import { useCallback, useRef } from "react";
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
  
  // CRITICAL DEBUGGING: Add call tracking
  const callCounterRef = useRef(0);
  const callHistoryRef = useRef<Array<{
    callNumber: number;
    timestamp: string;
    draggedPokemonId: number;
    sourceIndex: number;
    destinationIndex: number;
    stackTrace: string;
  }>>([]);

  // CRITICAL FIX: Add guard to prevent multiple calls for same reorder operation
  const lastReorderOperationRef = useRef<string | null>(null);
  const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle manual reordering by generating refinement battles
  const handleManualReorder = useCallback((
    draggedPokemonId: number, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    callCounterRef.current++;
    const callNumber = callCounterRef.current;
    const timestamp = new Date().toISOString();
    const stackTrace = new Error().stack || 'No stack trace';
    
    // CRITICAL DEBUGGING: Record this call
    const callRecord = {
      callNumber,
      timestamp,
      draggedPokemonId,
      sourceIndex,
      destinationIndex,
      stackTrace: stackTrace.split('\n').slice(0, 10).join('\n') // First 10 lines
    };
    
    callHistoryRef.current.push(callRecord);
    
    console.log(`🚨🚨🚨 [CALL_TRACKING] ===== MANUAL REORDER CALL #${callNumber} =====`);
    console.log(`🚨🚨🚨 [CALL_TRACKING] Timestamp: ${timestamp}`);
    console.log(`🚨🚨🚨 [CALL_TRACKING] Pokemon: ${draggedPokemonId}, ${sourceIndex} → ${destinationIndex}`);
    console.log(`🚨🚨🚨 [CALL_TRACKING] Stack trace:`);
    console.log(stackTrace.split('\n').slice(0, 8).join('\n'));
    console.log(`🚨🚨🚨 [CALL_TRACKING] Total calls so far: ${callCounterRef.current}`);
    console.log(`🚨🚨🚨 [CALL_TRACKING] Call history:`, callHistoryRef.current.map(c => 
      `#${c.callNumber}: ${c.draggedPokemonId} (${c.sourceIndex}→${c.destinationIndex}) at ${c.timestamp}`
    ));
    
    // Check if this is a duplicate call
    const recentCalls = callHistoryRef.current.filter(c => 
      Date.now() - new Date(c.timestamp).getTime() < 2000 // Last 2 seconds
    );
    
    const duplicateCalls = recentCalls.filter(c => 
      c.draggedPokemonId === draggedPokemonId &&
      c.sourceIndex === sourceIndex &&
      c.destinationIndex === destinationIndex &&
      c.callNumber !== callNumber
    );
    
    if (duplicateCalls.length > 0) {
      console.log(`🚨🚨🚨 [CALL_TRACKING] ❌ DUPLICATE CALL DETECTED!`);
      console.log(`🚨🚨🚨 [CALL_TRACKING] Previous identical calls:`, duplicateCalls);
      console.log(`🚨🚨🚨 [CALL_TRACKING] IGNORING DUPLICATE CALL #${callNumber}`);
      return;
    }
    
    console.log(`🚨🚨🚨 [CALL_TRACKING] ✅ PROCEEDING WITH CALL #${callNumber}`);
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER START =====`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Raw draggedPokemonId:`, draggedPokemonId, typeof draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Pokemon moved from ${sourceIndex} to ${destinationIndex}`);
    
    // CRITICAL FIX: Create unique operation ID and prevent duplicates
    const operationId = `${draggedPokemonId}-${sourceIndex}-${destinationIndex}-${Date.now()}`;
    const operationKey = `${draggedPokemonId}-${sourceIndex}-${destinationIndex}`;
    
    console.log(`🚨 [DUPLICATE_PREVENTION] Operation ID: ${operationId}`);
    console.log(`🚨 [DUPLICATE_PREVENTION] Operation Key: ${operationKey}`);
    console.log(`🚨 [DUPLICATE_PREVENTION] Last operation: ${lastReorderOperationRef.current}`);
    
    // Clear any existing timeout
    if (reorderTimeoutRef.current) {
      clearTimeout(reorderTimeoutRef.current);
      console.log(`🚨 [DUPLICATE_PREVENTION] Cleared existing timeout`);
    }
    
    // Check if this is a duplicate call within a short time window
    if (lastReorderOperationRef.current === operationKey) {
      console.log(`🚨 [DUPLICATE_PREVENTION] ❌ DUPLICATE CALL DETECTED - ignoring`);
      console.log(`🚨 [DUPLICATE_PREVENTION] This is likely a React re-render or double event`);
      return;
    }
    
    // Mark this operation as in progress
    lastReorderOperationRef.current = operationKey;
    console.log(`🚨 [DUPLICATE_PREVENTION] ✅ New operation marked: ${operationKey}`);
    
    // Set timeout to clear the guard after a reasonable time
    reorderTimeoutRef.current = setTimeout(() => {
      lastReorderOperationRef.current = null;
      console.log(`🚨 [DUPLICATE_PREVENTION] Guard cleared after timeout`);
    }, 1000); // 1 second guard
    
    // Convert to proper number type
    const pokemonId = typeof draggedPokemonId === 'string' ? parseInt(draggedPokemonId, 10) : Number(draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Converted Pokemon ID: ${pokemonId} (type: ${typeof pokemonId})`);
    
    if (isNaN(pokemonId)) {
      console.error(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Invalid Pokemon ID: ${draggedPokemonId}`);
      lastReorderOperationRef.current = null; // Clear guard on error
      return;
    }
    
    // Get the dragged Pokemon info
    const draggedPokemon = finalRankings.find(p => p.id === pokemonId);
    if (!draggedPokemon) {
      console.error(`🔄 [MANUAL_REORDER_ULTRA_TRACE] Could not find dragged Pokemon ${pokemonId} in rankings`);
      lastReorderOperationRef.current = null; // Clear guard on error
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
      lastReorderOperationRef.current = null; // Clear guard when no work to do
      return;
    }
    
    // CRITICAL DEBUGGING: Check queue state BEFORE queueing
    console.log(`🚨🚨🚨 [QUEUE_STATE_BEFORE] Queue size before queueing: ${refinementQueue.refinementBattleCount}`);
    console.log(`🚨🚨🚨 [QUEUE_STATE_BEFORE] Queue contents before:`, refinementQueue.refinementQueue.map(r => `${r.primaryPokemonId} vs ${r.opponentPokemonId}`));
    
    // Queue refinement battles for this manual reorder
    try {
      console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] CALLING queueBattlesForReorder with:`, {
        pokemonId,
        neighborIds,
        destinationIndex,
        queueSizeBefore: refinementQueue.refinementBattleCount,
        operationId
      });
      
      refinementQueue.queueBattlesForReorder(
        pokemonId,
        neighborIds,
        destinationIndex
      );
      
      // CRITICAL DEBUGGING: Check queue state IMMEDIATELY AFTER queueing
      console.log(`🚨🚨🚨 [QUEUE_STATE_AFTER] Queue size IMMEDIATELY after queueing: ${refinementQueue.refinementBattleCount}`);
      console.log(`🚨🚨🚨 [QUEUE_STATE_AFTER] Queue contents IMMEDIATELY after:`, refinementQueue.refinementQueue.map(r => `${r.primaryPokemonId} vs ${r.opponentPokemonId}`));
      
      // Check for duplicates in the queue
      const queueBattles = refinementQueue.refinementQueue;
      const duplicates = queueBattles.filter((battle, index) => {
        const isDuplicate = queueBattles.findIndex(other => 
          (other.primaryPokemonId === battle.primaryPokemonId && other.opponentPokemonId === battle.opponentPokemonId) ||
          (other.primaryPokemonId === battle.opponentPokemonId && other.opponentPokemonId === battle.primaryPokemonId)
        ) !== index;
        return isDuplicate;
      });
      
      if (duplicates.length > 0) {
        console.log(`🚨🚨🚨 [DUPLICATE_DETECTION] ❌ DUPLICATES FOUND IN QUEUE:`, duplicates);
      } else {
        console.log(`🚨🚨🚨 [DUPLICATE_DETECTION] ✅ No duplicates found in queue`);
      }
      
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
          destinationIndex: destinationIndex,
          operationId: operationId
        }
      });
      
      document.dispatchEvent(forceNextBattleEvent);
      console.log(`🚀 [MANUAL_REORDER_ULTRA_TRACE] ✅ Event dispatched successfully with operation ID: ${operationId}`);
      
    } catch (error) {
      console.error(`❌ [MANUAL_REORDER_ULTRA_TRACE] Error queueing refinement battles:`, error);
      lastReorderOperationRef.current = null; // Clear guard on error
    }
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER END =====`);
    console.log(`🚨🚨🚨 [CALL_TRACKING] ===== END CALL #${callNumber} =====`);
  }, [refinementQueue, finalRankings]);

  // CRITICAL FIX: Enhanced battle completion with proper battle history tracking
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
        
        // CRITICAL FIX: Mark these Pokemon as recently battled to prevent immediate re-pairing
        const battleKey = battleIds.join('-');
        const recentBattles = JSON.parse(localStorage.getItem('pokemon-battle-recently-used') || '[]');
        recentBattles.push(battleKey);
        
        // Keep only recent battles (last 50)
        if (recentBattles.length > 50) {
          recentBattles.splice(0, recentBattles.length - 50);
        }
        
        localStorage.setItem('pokemon-battle-recently-used', JSON.stringify(recentBattles));
        console.log(`🔄 [BATTLE_HISTORY_FIX] ✅ Added battle ${battleKey} to recent battle history`);
        console.log(`🔄 [BATTLE_HISTORY_FIX] Recent battles now: ${recentBattles.length} entries`);
        
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
        
        // CRITICAL FIX: Pop the completed refinement battle and handle next steps
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
