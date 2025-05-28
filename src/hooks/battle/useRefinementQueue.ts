
import { useState, useCallback } from "react";

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string; // For debugging/logging
}

export const useRefinementQueue = () => {
  const [refinementQueue, setRefinementQueue] = useState<RefinementBattle[]>([]);

  const queueBattlesForReorder = useCallback((primaryId: number, neighbors: number[], newPosition: number) => {
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== QUEUEING VALIDATION BATTLES =====`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Primary Pokemon ID: ${primaryId}`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] New position: ${newPosition}`);
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Neighbors to battle: ${neighbors.join(', ')}`);
    
    // CRITICAL FIX: Clear any existing refinement battles for this Pokemon first
    setRefinementQueue(prev => {
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue size before filtering: ${prev.length}`);
      
      const filtered = prev.filter(b => {
        const shouldKeep = b.primaryPokemonId !== primaryId && b.opponentPokemonId !== primaryId;
        if (!shouldKeep) {
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Removing existing battle: ${b.primaryPokemonId} vs ${b.opponentPokemonId}`);
        }
        return shouldKeep;
      });
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Queue size after filtering: ${filtered.length}`);
      
      // CRITICAL FIX: Create only ONE validation battle with the most relevant neighbor
      const validNeighbors = neighbors.filter(opponentId => opponentId && opponentId !== primaryId);
      
      if (validNeighbors.length === 0) {
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] No valid neighbors for validation`);
        return filtered;
      }
      
      // Use the first neighbor for validation (most relevant)
      const opponentId = validNeighbors[0];
      const battle = {
        primaryPokemonId: primaryId,
        opponentPokemonId: opponentId,
        reason: `Position validation for manual reorder to position ${newPosition} (dragged from milestone)`
      };
      
      const totalBattles = [...filtered, battle];
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Created 1 validation battle: ${primaryId} vs ${opponentId}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Total refinement battles queued: ${totalBattles.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ===== END QUEUEING VALIDATION BATTLES =====`);
      
      return totalBattles;
    });
  }, []);

  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    const next = refinementQueue.length > 0 ? refinementQueue[0] : null;
    if (next) {
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Next battle is refinement: ${next.primaryPokemonId} vs ${next.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Reason: ${next.reason}`);
    } else {
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ❌ No refinement battles in queue`);
    }
    return next;
  }, [refinementQueue]);

  const popRefinementBattle = useCallback(() => {
    setRefinementQueue(prev => {
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] Attempting to pop from queue of size: ${prev.length}`);
      if (prev.length > 0) {
        const completed = prev[0];
        const remaining = prev.length - 1;
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Completed refinement battle: ${completed.primaryPokemonId} vs ${completed.opponentPokemonId}`);
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ ${remaining} battles remaining in queue`);
        
        const newQueue = prev.slice(1);
        
        if (remaining > 0) {
          console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Next refinement battle: ${newQueue[0].primaryPokemonId} vs ${newQueue[0].opponentPokemonId}`);
        } else {
          console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ All refinement battles completed, returning to regular battle generation`);
        }
        return newQueue;
      }
      console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] ⚠️ Attempted to pop from empty queue`);
      return prev;
    });
  }, []);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Clearing all ${refinementQueue.length} refinement battles`);
    setRefinementQueue([]);
  }, [refinementQueue.length]);

  const hasRefinementBattles = refinementQueue.length > 0;

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
