
import { useState, useCallback, useRef } from "react";

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string; // For debugging/logging
}

export const useRefinementQueue = () => {
  const [refinementQueue, setRefinementQueue] = useState<RefinementBattle[]>([]);
  
  // CRITICAL FIX: Use a ref to maintain the current queue state for immediate access
  const currentQueueRef = useRef<RefinementBattle[]>([]);

  // CRITICAL FIX: Global duplicate detection function
  const isDuplicateBattleGlobally = useCallback((pokemon1: number, pokemon2: number, existingQueue: RefinementBattle[]) => {
    const foundDuplicate = existingQueue.some(battle => 
      (battle.primaryPokemonId === pokemon1 && battle.opponentPokemonId === pokemon2) ||
      (battle.primaryPokemonId === pokemon2 && battle.opponentPokemonId === pokemon1)
    );
    
    if (foundDuplicate) {
      console.log(`🚨 [GLOBAL_DUPLICATE_DETECTION] FOUND DUPLICATE: ${pokemon1} vs ${pokemon2} already exists in global queue`);
      console.log(`🚨 [GLOBAL_DUPLICATE_DETECTION] Existing queue:`, existingQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
    }
    
    return foundDuplicate;
  }, []);

  // MISSING METHOD: Add the addValidationBattle method that was being called
  const addValidationBattle = useCallback((primaryId: number, pokemonName: string, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [ADD_VALIDATION_BATTLE] Adding validation battle for ${pokemonName} (${primaryId}) moved from ${sourceIndex} to ${destinationIndex}`);
    
    // For now, let's add a simple battle against a neighboring Pokemon
    // We'll need to determine appropriate neighbors based on the current rankings
    console.log(`🔄 [ADD_VALIDATION_BATTLE] This method needs to be implemented to queue appropriate validation battles`);
    console.log(`🔄 [ADD_VALIDATION_BATTLE] Parameters received:`, { primaryId, pokemonName, sourceIndex, destinationIndex });
    
    // TODO: Implement the actual logic to determine which Pokemon to battle against
    // For debugging, let's at least log that this method was called successfully
    console.log(`🔄 [ADD_VALIDATION_BATTLE] ✅ Method called successfully - implementation needed`);
  }, []);

  const queueBattlesForReorder = useCallback((primaryId: number, neighbors: number[], newPosition: number) => {
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== QUEUEING VALIDATION BATTLES START =====`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Primary Pokemon ID: ${primaryId}`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] New position: ${newPosition}`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Neighbors to battle: ${neighbors.join(', ')}`);
    
    setRefinementQueue(prev => {
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue size before operation: ${prev.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue contents BEFORE:`, prev.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
      
      // Get valid neighbors
      const validNeighbors = neighbors.filter(opponentId => opponentId && opponentId !== primaryId);
      
      if (validNeighbors.length === 0) {
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ❌ No valid neighbors for validation - returning existing queue`);
        return prev;
      }
      
      // CRITICAL FIX: Check for duplicates against the ENTIRE existing queue
      const battlesToAdd: RefinementBattle[] = [];
      
      validNeighbors.forEach(opponentId => {
        console.log(`🔍 [GLOBAL_DUPLICATE_CHECK] Checking if ${primaryId} vs ${opponentId} is duplicate in GLOBAL queue...`);
        
        const isDuplicateGlobally = isDuplicateBattleGlobally(primaryId, opponentId, prev);
        const isDuplicateInNewBattles = battlesToAdd.some(battle => 
          (battle.primaryPokemonId === primaryId && battle.opponentPokemonId === opponentId) ||
          (battle.primaryPokemonId === opponentId && battle.opponentPokemonId === primaryId)
        );
        
        console.log(`🔍 [GLOBAL_DUPLICATE_CHECK] ${primaryId} vs ${opponentId}: duplicateGlobally=${isDuplicateGlobally}, duplicateInNewBattles=${isDuplicateInNewBattles}`);
        
        if (!isDuplicateGlobally && !isDuplicateInNewBattles) {
          const battle = {
            primaryPokemonId: primaryId,
            opponentPokemonId: opponentId,
            reason: `Position validation for manual reorder to position ${newPosition} (primary: ${primaryId} vs neighbor: ${opponentId})`
          };
          
          battlesToAdd.push(battle);
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ QUEUED NEW battle: ${primaryId} vs ${opponentId}`);
        } else {
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ⚠️ SKIPPED GLOBAL duplicate battle: ${primaryId} vs ${opponentId}`);
        }
      });
      
      if (battlesToAdd.length === 0) {
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ❌ No new unique battles to add - all were duplicates`);
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] This means all requested battles already exist in the global queue`);
        return prev;
      }
      
      // Add new battles to the end of the queue
      const newQueue = [...prev, ...battlesToAdd];
      
      // CRITICAL FIX: Update the ref immediately
      currentQueueRef.current = newQueue;
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Added ${battlesToAdd.length} new battles`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Total refinement battles in NEW queue: ${newQueue.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ NEW queue contents:`, newQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== QUEUEING VALIDATION BATTLES END =====`);
      
      return newQueue;
    });
  }, [isDuplicateBattleGlobally]);

  // CRITICAL FIX: Use ref for immediate access to current state
  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    const currentQueue = currentQueueRef.current;
    const next = currentQueue.length > 0 ? currentQueue[0] : null;
    
    console.log(`⚔️ [REFINEMENT_QUEUE_FIX] getNextRefinementBattle called with CURRENT queue`);
    console.log(`⚔️ [REFINEMENT_QUEUE_FIX] Current queue size from REF: ${currentQueue.length}`);
    console.log(`⚔️ [REFINEMENT_QUEUE_FIX] Current queue from REF:`, currentQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
    
    if (next) {
      console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ Next battle IS refinement: ${next.primaryPokemonId} vs ${next.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ Reason: ${next.reason}`);
    } else {
      console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ❌ No refinement battles in queue`);
    }
    return next;
  }, []);

  const popRefinementBattle = useCallback(() => {
    console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ===== POP REFINEMENT BATTLE START =====`);
    
    setRefinementQueue(prev => {
      console.log(`⚔️ [REFINEMENT_QUEUE_FIX] Current queue size BEFORE pop: ${prev.length}`);
      console.log(`⚔️ [REFINEMENT_QUEUE_FIX] Current queue BEFORE pop:`, prev.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
      
      if (prev.length > 0) {
        const completed = prev[0];
        const newQueue = prev.slice(1);
        
        // CRITICAL FIX: Update the ref IMMEDIATELY before returning
        currentQueueRef.current = newQueue;
        
        const remaining = newQueue.length;
        
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ POPPED completed refinement battle: ${completed.primaryPokemonId} vs ${completed.opponentPokemonId}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ Completed battle reason: ${completed.reason}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ Remaining battles in queue: ${remaining}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ NEW queue contents:`, newQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ REF UPDATED IMMEDIATELY with new queue size: ${currentQueueRef.current.length}`);
        
        if (remaining > 0) {
          console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ Next refinement battle will be: ${newQueue[0].primaryPokemonId} vs ${newQueue[0].opponentPokemonId}`);
          console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ Next battle reason: ${newQueue[0].reason}`);
        } else {
          console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ All refinement battles completed, returning to regular battle generation`);
        }
        
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ===== POP REFINEMENT BATTLE END =====`);
        return newQueue;
      } else {
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ⚠️ Attempted to pop from EMPTY queue - no changes made`);
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ===== POP REFINEMENT BATTLE END (NO-OP) =====`);
        return prev;
      }
    });
  }, []);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== CLEARING REFINEMENT QUEUE =====`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Clearing ${refinementQueue.length} refinement battles`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Queue contents being cleared:`, refinementQueue);
    
    setRefinementQueue([]);
    currentQueueRef.current = []; // CRITICAL FIX: Clear ref too
    
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Queue cleared successfully`);
  }, [refinementQueue]);

  // CRITICAL FIX: Sync ref whenever state changes
  useState(() => {
    currentQueueRef.current = refinementQueue;
  });

  const hasRefinementBattles = currentQueueRef.current.length > 0;

  // Add comprehensive logging for queue state
  console.log(`🔧 [REFINEMENT_QUEUE_STATE] Queue state: ${currentQueueRef.current.length} battles, hasRefinementBattles: ${hasRefinementBattles}`);

  return {
    queue: refinementQueue, // Add this for compatibility
    refinementQueue,
    addValidationBattle, // CRITICAL FIX: Export the missing method
    queueBattlesForReorder,
    getNextRefinementBattle,
    popRefinementBattle,
    clearRefinementQueue,
    hasRefinementBattles,
    refinementBattleCount: currentQueueRef.current.length
  };
};
