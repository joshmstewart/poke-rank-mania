
import { useState, useCallback } from "react";

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string; // For debugging/logging
}

export const useRefinementQueue = () => {
  const [refinementQueue, setRefinementQueue] = useState<RefinementBattle[]>([]);

  const queueBattlesForReorder = useCallback((primaryId: number, neighbors: number[], newPosition: number) => {
    console.log(`🔄 [REFINEMENT_QUEUE] Queueing validation battles for Pokemon ${primaryId} at new position ${newPosition}`);
    
    // Filter out any existing refinement battles for this Pokemon
    setRefinementQueue(prev => {
      const filtered = prev.filter(b => b.primaryPokemonId !== primaryId);
      
      // Create new refinement battles with valid neighbors
      const newBattles = neighbors
        .filter(opponentId => opponentId && opponentId !== primaryId)
        .slice(0, 3) // Limit to 3 battles max
        .map(opponentId => ({
          primaryPokemonId: primaryId,
          opponentPokemonId: opponentId,
          reason: `Position validation for manual reorder to position ${newPosition}`
        }));
      
      const totalBattles = [...filtered, ...newBattles];
      console.log(`🔄 [REFINEMENT_QUEUE] Added ${newBattles.length} refinement battles for Pokemon ${primaryId}`);
      console.log(`🔄 [REFINEMENT_QUEUE] Total refinement battles queued: ${totalBattles.length}`);
      console.log(`🔄 [REFINEMENT_QUEUE] Next ${Math.min(3, totalBattles.length)} battles will be validation battles`);
      
      return totalBattles;
    });
  }, []);

  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    const next = refinementQueue.length > 0 ? refinementQueue[0] : null;
    if (next) {
      console.log(`⚔️ [REFINEMENT_QUEUE] Next battle will be refinement: ${next.primaryPokemonId} vs ${next.opponentPokemonId}`);
    }
    return next;
  }, [refinementQueue]);

  const popRefinementBattle = useCallback(() => {
    setRefinementQueue(prev => {
      if (prev.length > 0) {
        const remaining = prev.length - 1;
        console.log(`⚔️ [REFINEMENT_QUEUE] Completed refinement battle, ${remaining} remaining`);
        if (remaining > 0) {
          console.log(`⚔️ [REFINEMENT_QUEUE] Next refinement battle: ${prev[1].primaryPokemonId} vs ${prev[1].opponentPokemonId}`);
        } else {
          console.log(`⚔️ [REFINEMENT_QUEUE] All refinement battles completed, returning to regular battle generation`);
        }
        return prev.slice(1);
      }
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
