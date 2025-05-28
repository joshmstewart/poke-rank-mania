
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
    
    setRefinementQueue(prev => {
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue size before operation: ${prev.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue contents BEFORE:`, prev);
      
      // CRITICAL FIX: Clear any existing refinement battles for this Pokemon first
      const filtered = prev.filter(b => {
        const shouldKeep = b.primaryPokemonId !== primaryId && b.opponentPokemonId !== primaryId;
        if (!shouldKeep) {
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] REMOVING existing battle: ${b.primaryPokemonId} vs ${b.opponentPokemonId} (reason: ${b.reason})`);
        }
        return shouldKeep;
      });
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Queue size after filtering out existing battles: ${filtered.length}`);
      
      // CRITICAL FIX: Create only ONE validation battle with the most relevant neighbor
      const validNeighbors = neighbors.filter(opponentId => opponentId && opponentId !== primaryId);
      
      if (validNeighbors.length === 0) {
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ❌ No valid neighbors for validation - returning filtered queue`);
        return filtered;
      }
      
      // Use the first neighbor for validation (most relevant)
      const opponentId = validNeighbors[0];
      const battle = {
        primaryPokemonId: primaryId,
        opponentPokemonId: opponentId,
        reason: `Position validation for manual reorder to position ${newPosition} (dragged from milestone)`
      };
      
      const newQueue = [...filtered, battle];
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ CREATED validation battle: ${primaryId} vs ${opponentId}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Reason: ${battle.reason}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Total refinement battles in NEW queue: ${newQueue.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ NEW queue contents:`, newQueue);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== QUEUEING VALIDATION BATTLES END =====`);
      
      return newQueue;
    });
  }, []);

  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    const next = refinementQueue.length > 0 ? refinementQueue[0] : null;
    console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] getNextRefinementBattle called`);
    console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue size: ${refinementQueue.length}`);
    console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue:`, refinementQueue);
    
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
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue BEFORE pop:`, prev);
      
      if (prev.length > 0) {
        const completed = prev[0];
        const newQueue = prev.slice(1);
        const remaining = newQueue.length;
        
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ POPPED completed refinement battle: ${completed.primaryPokemonId} vs ${completed.opponentPokemonId}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Completed battle reason: ${completed.reason}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Remaining battles in queue: ${remaining}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ NEW queue contents:`, newQueue);
        
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
    hasRefinementBattles,
    refinementBattleCount: refinementQueue.length
  };
};
