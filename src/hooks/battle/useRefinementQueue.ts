import { useState, useCallback } from "react";

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string; // For debugging/logging
}

export const useRefinementQueue = () => {
  const [refinementQueue, setRefinementQueue] = useState<RefinementBattle[]>([]);

  const queueBattlesForReorder = useCallback((primaryId: number, neighbors: number[], newPosition: number) => {
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== QUEUEING VALIDATION BATTLES START =====`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Primary Pokemon ID: ${primaryId}`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] New position: ${newPosition}`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Neighbors to battle: ${neighbors.join(', ')}`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] CALL STACK:`, new Error().stack?.split('\n').slice(0, 5).join('\n'));
    
    setRefinementQueue(prev => {
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue size before operation: ${prev.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue contents BEFORE:`, prev.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
      
      // CRITICAL FIX: Don't remove existing battles, just add new unique ones
      const currentQueue = [...prev];
      
      // Get valid neighbors
      const validNeighbors = neighbors.filter(opponentId => opponentId && opponentId !== primaryId);
      
      if (validNeighbors.length === 0) {
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ❌ No valid neighbors for validation - returning existing queue`);
        return prev;
      }
      
      // CRITICAL DEBUG: Check for duplicate battles (same Pokemon pair regardless of order)
      const isDuplicateBattle = (pokemon1: number, pokemon2: number, existingBattles: RefinementBattle[]) => {
        const foundDuplicate = existingBattles.some(battle => 
          (battle.primaryPokemonId === pokemon1 && battle.opponentPokemonId === pokemon2) ||
          (battle.primaryPokemonId === pokemon2 && battle.opponentPokemonId === pokemon1)
        );
        
        if (foundDuplicate) {
          console.log(`🚨 [DUPLICATE_DETECTION] FOUND DUPLICATE: ${pokemon1} vs ${pokemon2} already exists in queue`);
          console.log(`🚨 [DUPLICATE_DETECTION] Existing battles:`, existingBattles.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
        }
        
        return foundDuplicate;
      };
      
      // Add battles for each valid neighbor, but only if not duplicate
      const battlesToAdd: RefinementBattle[] = [];
      
      validNeighbors.forEach(opponentId => {
        console.log(`🔍 [DUPLICATE_CHECK] Checking if ${primaryId} vs ${opponentId} is duplicate...`);
        
        const isDuplicateInQueue = isDuplicateBattle(primaryId, opponentId, currentQueue);
        const isDuplicateInNewBattles = isDuplicateBattle(primaryId, opponentId, battlesToAdd);
        
        console.log(`🔍 [DUPLICATE_CHECK] ${primaryId} vs ${opponentId}: duplicateInQueue=${isDuplicateInQueue}, duplicateInNewBattles=${isDuplicateInNewBattles}`);
        
        if (!isDuplicateInQueue && !isDuplicateInNewBattles) {
          const battle = {
            primaryPokemonId: primaryId,
            opponentPokemonId: opponentId,
            reason: `Position validation for manual reorder to position ${newPosition} (primary: ${primaryId} vs neighbor: ${opponentId})`
          };
          
          battlesToAdd.push(battle);
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ QUEUED NEW battle: ${primaryId} vs ${opponentId}`);
        } else {
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ⚠️ SKIPPED duplicate battle: ${primaryId} vs ${opponentId}`);
        }
      });
      
      if (battlesToAdd.length === 0) {
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ❌ No new unique battles to add`);
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] This means all requested battles already exist in queue`);
        return prev;
      }
      
      // Add new battles to the end of the queue
      const newQueue = [...currentQueue, ...battlesToAdd];
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Added ${battlesToAdd.length} new battles`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Total refinement battles in NEW queue: ${newQueue.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ NEW queue contents:`, newQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`));
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== QUEUEING VALIDATION BATTLES END =====`);
      
      return newQueue;
    });
  }, []);

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
