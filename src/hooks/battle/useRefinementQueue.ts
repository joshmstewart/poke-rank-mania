
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
      
      console.log(`🔄 [REFINEMENT_QUEUE] Added ${newBattles.length} refinement battles for Pokemon ${primaryId}`);
      return [...filtered, ...newBattles];
    });
  }, []);

  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    return refinementQueue.length > 0 ? refinementQueue[0] : null;
  }, [refinementQueue]);

  const popRefinementBattle = useCallback(() => {
    setRefinementQueue(prev => {
      if (prev.length > 0) {
        console.log(`⚔️ [REFINEMENT_QUEUE] Completed refinement battle, ${prev.length - 1} remaining`);
        return prev.slice(1);
      }
      return prev;
    });
  }, []);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🔄 [REFINEMENT_QUEUE] Clearing all refinement battles`);
    setRefinementQueue([]);
  }, []);

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
