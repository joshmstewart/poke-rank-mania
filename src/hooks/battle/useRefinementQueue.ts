
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
    console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Neighbors count: ${neighbors.length}`);
    
    // Filter out any existing refinement battles for this Pokemon
    setRefinementQueue(prev => {
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue size before filtering: ${prev.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Current queue before filtering:`, prev);
      
      const filtered = prev.filter(b => {
        const shouldKeep = b.primaryPokemonId !== primaryId && b.opponentPokemonId !== primaryId;
        if (!shouldKeep) {
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Removing existing battle: ${b.primaryPokemonId} vs ${b.opponentPokemonId}`);
        }
        return shouldKeep;
      });
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Queue size after filtering: ${filtered.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Queue after filtering:`, filtered);
      
      // Create new refinement battles with valid neighbors
      const newBattles = neighbors
        .filter(opponentId => {
          const isValid = opponentId && opponentId !== primaryId;
          if (!isValid) {
            console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Skipping invalid opponent: ${opponentId} (${!opponentId ? 'falsy' : 'same as primary'})`);
          }
          return isValid;
        })
        .slice(0, 5) // Increase to 5 battles max for better validation
        .map((opponentId, index) => {
          const battle = {
            primaryPokemonId: primaryId,
            opponentPokemonId: opponentId,
            reason: `Position validation for manual reorder to position ${newPosition} (dragged from milestone)`
          };
          console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Creating battle ${index + 1}: ${primaryId} vs ${opponentId}`);
          return battle;
        });
      
      const totalBattles = [...filtered, ...newBattles];
      
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Created ${newBattles.length} new refinement battles`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Total refinement battles queued: ${totalBattles.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Final queue:`, totalBattles);
      console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] ✅ Next ${Math.min(newBattles.length, totalBattles.length)} battles will be validation battles`);
      
      // Log each battle for debugging
      newBattles.forEach((battle, index) => {
        console.log(`🔄 [REFINEMENT_QUEUE_ULTRA_DEBUG] Battle ${index + 1}: Pokemon ${battle.primaryPokemonId} vs ${battle.opponentPokemonId}`);
      });
      
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
        console.log(`⚔️ [REFINEMENT_QUEUE_ULTRA_DEBUG] New queue after pop:`, newQueue);
        
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
