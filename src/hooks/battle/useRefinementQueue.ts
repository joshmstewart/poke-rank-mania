
import { useState, useCallback } from "react";

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string; // For debugging/logging
}

export const useRefinementQueue = () => {
  const [refinementQueue, setRefinementQueue] = useState<RefinementBattle[]>([]);

  const queueBattlesForReorder = useCallback((primaryId: number, neighbors: number[], newPosition: number) => {
    console.log(`🔄 [REFINEMENT_QUEUE] ===== QUEUEING VALIDATION BATTLES =====`);
    console.log(`🔄 [REFINEMENT_QUEUE] Primary Pokemon ID: ${primaryId}`);
    console.log(`🔄 [REFINEMENT_QUEUE] New position: ${newPosition}`);
    console.log(`🔄 [REFINEMENT_QUEUE] Neighbors to battle: ${neighbors.join(', ')}`);
    console.log(`🔄 [REFINEMENT_QUEUE] Neighbors count: ${neighbors.length}`);
    
    // Filter out any existing refinement battles for this Pokemon
    setRefinementQueue(prev => {
      console.log(`🔄 [REFINEMENT_QUEUE] Current queue size before filtering: ${prev.length}`);
      
      const filtered = prev.filter(b => {
        const shouldKeep = b.primaryPokemonId !== primaryId && b.opponentPokemonId !== primaryId;
        if (!shouldKeep) {
          console.log(`🔄 [REFINEMENT_QUEUE] Removing existing battle: ${b.primaryPokemonId} vs ${b.opponentPokemonId}`);
        }
        return shouldKeep;
      });
      
      console.log(`🔄 [REFINEMENT_QUEUE] Queue size after filtering: ${filtered.length}`);
      
      // Create new refinement battles with valid neighbors
      const newBattles = neighbors
        .filter(opponentId => {
          const isValid = opponentId && opponentId !== primaryId;
          if (!isValid) {
            console.log(`🔄 [REFINEMENT_QUEUE] Skipping invalid opponent: ${opponentId} (${!opponentId ? 'falsy' : 'same as primary'})`);
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
          console.log(`🔄 [REFINEMENT_QUEUE] Creating battle ${index + 1}: ${primaryId} vs ${opponentId}`);
          return battle;
        });
      
      const totalBattles = [...filtered, ...newBattles];
      
      console.log(`🔄 [REFINEMENT_QUEUE] ✅ Created ${newBattles.length} new refinement battles`);
      console.log(`🔄 [REFINEMENT_QUEUE] ✅ Total refinement battles queued: ${totalBattles.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE] ✅ Next ${Math.min(newBattles.length, totalBattles.length)} battles will be validation battles`);
      
      // Log each battle for debugging
      newBattles.forEach((battle, index) => {
        console.log(`🔄 [REFINEMENT_QUEUE] Battle ${index + 1}: Pokemon ${battle.primaryPokemonId} vs ${battle.opponentPokemonId}`);
      });
      
      console.log(`🔄 [REFINEMENT_QUEUE] ===== END QUEUEING VALIDATION BATTLES =====`);
      
      return totalBattles;
    });
  }, []);

  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    const next = refinementQueue.length > 0 ? refinementQueue[0] : null;
    if (next) {
      console.log(`⚔️ [REFINEMENT_QUEUE] ✅ Next battle is refinement: ${next.primaryPokemonId} vs ${next.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_QUEUE] ✅ Reason: ${next.reason}`);
    }
    return next;
  }, [refinementQueue]);

  const popRefinementBattle = useCallback(() => {
    setRefinementQueue(prev => {
      if (prev.length > 0) {
        const completed = prev[0];
        const remaining = prev.length - 1;
        console.log(`⚔️ [REFINEMENT_QUEUE] ✅ Completed refinement battle: ${completed.primaryPokemonId} vs ${completed.opponentPokemonId}`);
        console.log(`⚔️ [REFINEMENT_QUEUE] ✅ ${remaining} battles remaining in queue`);
        
        if (remaining > 0) {
          console.log(`⚔️ [REFINEMENT_QUEUE] ✅ Next refinement battle: ${prev[1].primaryPokemonId} vs ${prev[1].opponentPokemonId}`);
        } else {
          console.log(`⚔️ [REFINEMENT_QUEUE] ✅ All refinement battles completed, returning to regular battle generation`);
        }
        return prev.slice(1);
      }
      console.log(`⚔️ [REFINEMENT_QUEUE] ⚠️ Attempted to pop from empty queue`);
      return prev;
    });
  }, []);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🔄 [REFINEMENT_QUEUE] Clearing all ${refinementQueue.length} refinement battles`);
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
