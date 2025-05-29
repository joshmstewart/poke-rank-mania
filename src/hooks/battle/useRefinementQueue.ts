
import { useState, useCallback, useRef } from "react";

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string; // For debugging/logging
}

export const useRefinementQueue = () => {
  console.log(`🔧 [QUEUE_INIT_TRACE] ===== useRefinementQueue INITIALIZATION =====`);
  
  const [refinementQueue, setRefinementQueue] = useState<RefinementBattle[]>([]);
  
  // Use a ref to maintain the current queue state for immediate access
  const currentQueueRef = useRef<RefinementBattle[]>([]);

  console.log(`🔧 [QUEUE_INIT_TRACE] Initial state set, queue length: ${refinementQueue.length}`);

  // Global duplicate detection function
  const isDuplicateBattleGlobally = useCallback((pokemon1: number, pokemon2: number, existingQueue: RefinementBattle[]) => {
    const foundDuplicate = existingQueue.some(battle => 
      (battle.primaryPokemonId === pokemon1 && battle.opponentPokemonId === pokemon2) ||
      (battle.primaryPokemonId === pokemon2 && battle.opponentPokemonId === pokemon1)
    );
    
    if (foundDuplicate) {
      console.log(`🚨 [GLOBAL_DUPLICATE_DETECTION] FOUND DUPLICATE: ${pokemon1} vs ${pokemon2} already exists in global queue`);
    }
    
    return foundDuplicate;
  }, []);

  const addValidationBattle = useCallback((primaryId: number, pokemonName: string, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] ===== ADD VALIDATION BATTLE START =====`);
    console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] Function called with:`);
    console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] - primaryId: ${primaryId}`);
    console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] - pokemonName: ${pokemonName}`);
    console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] - sourceIndex: ${sourceIndex}`);
    console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] - destinationIndex: ${destinationIndex}`);
    
    // For now, let's add a simple battle against the Pokemon at the destination index
    const opponentId = destinationIndex + 1; // Simple placeholder logic - this needs improvement
    
    console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] Creating battle: ${primaryId} vs ${opponentId}`);
    
    const newBattle: RefinementBattle = {
      primaryPokemonId: primaryId,
      opponentPokemonId: opponentId,
      reason: `Manual reorder validation: ${pokemonName} moved from ${sourceIndex} to ${destinationIndex}`
    };
    
    console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] About to call setRefinementQueue...`);
    setRefinementQueue(prev => {
      const newQueue = [...prev, newBattle];
      currentQueueRef.current = newQueue;
      console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] Updated queue length: ${newQueue.length}`);
      return newQueue;
    });
    
    console.log(`🔄 [ADD_VALIDATION_MEGA_TRACE] ===== ADD VALIDATION BATTLE END =====`);
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
      
      // CRITICAL FIX: Create battles to ensure testing twice - use ALL valid neighbors
      const battlesToAdd: RefinementBattle[] = [];
      
      // Test against ALL neighbors, ensuring at least 2 battles for "testing twice"
      validNeighbors.forEach((opponentId, index) => {
        console.log(`🔍 [TESTING_TWICE_FIX] Creating battle ${index + 1} for ${primaryId} vs ${opponentId}`);
        
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
            reason: `Position validation ${index + 1}/${validNeighbors.length} for manual reorder to position ${newPosition} (primary: ${primaryId} vs neighbor: ${opponentId})`
          };
          
          battlesToAdd.push(battle);
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ QUEUED NEW battle ${index + 1}/${validNeighbors.length}: ${primaryId} vs ${opponentId}`);
        } else {
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ⚠️ SKIPPED GLOBAL duplicate battle: ${primaryId} vs ${opponentId}`);
        }
      });
      
      if (battlesToAdd.length === 0) {
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ❌ No new unique battles to add - all were duplicates`);
        return prev;
      }
      
      // CRITICAL FIX: Ensure at least 2 battles if possible for "testing twice"
      if (battlesToAdd.length === 1 && validNeighbors.length > 1) {
        console.log(`🔄 [TESTING_TWICE_FIX] Only 1 battle queued but more neighbors available - checking for additional battles`);
        
        // Try to add one more battle if possible
        const additionalNeighbor = validNeighbors.find(opponentId => 
          !battlesToAdd.some(battle => battle.opponentPokemonId === opponentId)
        );
        
        if (additionalNeighbor) {
          const additionalBattle = {
            primaryPokemonId: primaryId,
            opponentPokemonId: additionalNeighbor,
            reason: `Additional test 2/2 for manual reorder to position ${newPosition} (primary: ${primaryId} vs neighbor: ${additionalNeighbor})`
          };
          battlesToAdd.push(additionalBattle);
          console.log(`🔄 [TESTING_TWICE_FIX] ✅ Added second battle for testing twice: ${primaryId} vs ${additionalNeighbor}`);
        }
      }
      
      // Add new battles to the end of the queue
      const newQueue = [...prev, ...battlesToAdd];
      
      // Update the ref immediately
      currentQueueRef.current = newQueue;
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Added ${battlesToAdd.length} new battles for testing`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Total refinement battles in NEW queue: ${newQueue.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ NEW queue contents:`, newQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId} (${b.reason.includes('1/') ? '1st test' : b.reason.includes('2/') ? '2nd test' : 'test'})`));
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== QUEUEING VALIDATION BATTLES END =====`);
      
      return newQueue;
    });
  }, [isDuplicateBattleGlobally]);

  // Use ref for immediate access to current state
  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    const currentQueue = currentQueueRef.current;
    const next = currentQueue.length > 0 ? currentQueue[0] : null;
    
    console.log(`⚔️ [REFINEMENT_QUEUE_FIX] getNextRefinementBattle called with CURRENT queue`);
    console.log(`⚔️ [REFINEMENT_QUEUE_FIX] Current queue size from REF: ${currentQueue.length}`);
    
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
      
      if (prev.length > 0) {
        const completed = prev[0];
        const newQueue = prev.slice(1);
        
        // Update the ref IMMEDIATELY before returning
        currentQueueRef.current = newQueue;
        
        const remaining = newQueue.length;
        
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ POPPED completed refinement battle: ${completed.primaryPokemonId} vs ${completed.opponentPokemonId}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ Completed battle reason: ${completed.reason}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_FIX] ✅ Remaining battles in queue: ${remaining}`);
        
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
        return prev;
      }
    });
  }, []);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== CLEARING REFINEMENT QUEUE =====`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Clearing ${refinementQueue.length} refinement battles`);
    
    setRefinementQueue([]);
    currentQueueRef.current = [];
    
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Queue cleared successfully`);
  }, []);

  // Sync ref whenever state changes
  const hasRefinementBattles = currentQueueRef.current.length > 0;

  // Add comprehensive logging for queue state
  console.log(`🔧 [REFINEMENT_QUEUE_STATE] Current hook state:`);
  console.log(`🔧 [REFINEMENT_QUEUE_STATE] - refinementQueue.length: ${refinementQueue.length}`);
  console.log(`🔧 [REFINEMENT_QUEUE_STATE] - currentQueueRef.current.length: ${currentQueueRef.current.length}`);
  console.log(`🔧 [REFINEMENT_QUEUE_STATE] - hasRefinementBattles: ${hasRefinementBattles}`);

  return {
    queue: refinementQueue,
    refinementQueue,
    addValidationBattle,
    queueBattlesForReorder,
    getNextRefinementBattle,
    popRefinementBattle,
    clearRefinementQueue,
    hasRefinementBattles,
    refinementBattleCount: currentQueueRef.current.length
  };
};
