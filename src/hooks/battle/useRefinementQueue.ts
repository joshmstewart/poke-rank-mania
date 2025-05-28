import { useState, useCallback } from "react";

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string; // For debugging/logging
}

export const useRefinementQueue = () => {
  const [refinementQueue, setRefinementQueue] = useState<RefinementBattle[]>([]);

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
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Added ${battlesToAdd.length} new battles`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Total refinement battles in NEW queue: ${newQueue.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ NEW queue contents:`, newQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== QUEUEING VALIDATION BATTLES END =====`);
      
      return newQueue;
    });
  }, [isDuplicateBattleGlobally]);

  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    const next = refinementQueue.length > 0 ? refinementQueue[0] : null;
    console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] getNextRefinementBattle called`);
    console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue size: ${refinementQueue.length}`);
    console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue:`, refinementQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
    
    if (next) {
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Next battle IS refinement: ${next.primaryPokemonId} vs ${next.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Reason: ${next.reason}`);
    } else {
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ❌ No refinement battles in queue`);
    }
    return next;
  }, [refinementQueue]);

  const popRefinementBattle = useCallback(() => {
    console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== POP REFINEMENT BATTLE START =====`);
    
    setRefinementQueue(prev => {
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue size BEFORE pop: ${prev.length}`);
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue BEFORE pop:`, prev.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
      
      if (prev.length > 0) {
        const completed = prev[0];
        const newQueue = prev.slice(1);
        const remaining = newQueue.length;
        
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ POPPED completed refinement battle: ${completed.primaryPokemonId} vs ${completed.opponentPokemonId}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Completed battle reason: ${completed.reason}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Remaining battles in queue: ${remaining}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ NEW queue contents:`, newQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
        
        if (remaining > 0) {
          console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Next refinement battle will be: ${newQueue[0].primaryPokemonId} vs ${newQueue[0].opponentPokemonId}`);
          console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Next battle reason: ${newQueue[0].reason}`);
        } else {
          console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ All refinement battles completed, returning to regular battle generation`);
        }
        
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== POP REFINEMENT BATTLE END =====`);
        return newQueue;
      } else {
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ⚠️ Attempted to pop from EMPTY queue - no changes made`);
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== POP REFINEMENT BATTLE END (NO-OP) =====`);
        return prev;
      }
    });
  }, []);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== CLEARING REFINEMENT QUEUE =====`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Clearing ${refinementQueue.length} refinement battles`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Queue contents being cleared:`, refinementQueue);
    setRefinementQueue([]);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Queue cleared successfully`);
  }, [refinementQueue]);

  const hasRefinementBattles = refinementQueue.length > 0;

  // Add comprehensive logging for queue state
  console.log(`🔧 [REFINEMENT_QUEUE_STATE] Queue state: ${refinementQueue.length} battles, hasRefinementBattles: ${hasRefinementBattles}`);

  return {
    refinementQueue,
    queueBattlesForReorder,
    getNextRefinementBattle,
    popRefinementBattle,
    clearRefinementQueue,
    hasRefinementBattles: refinementQueue.length > 0,
    refinementBattleCount: refinementQueue.length
  };
};
