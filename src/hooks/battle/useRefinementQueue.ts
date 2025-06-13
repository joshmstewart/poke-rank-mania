
import { useState, useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string;
}

export const useRefinementQueue = () => {
  console.log(`🎯 [REFINEMENT_QUEUE_CORE] Hook initialized`);
  
  // CRITICAL FIX: Use TrueSkill store as the single source of truth
  const { 
    getAllPendingBattles, 
    removePendingBattle, 
    isPokemonPending,
    addPendingBattle,
    clearAllPendingBattles
  } = useTrueSkillStore();
  
  const [queue, setQueue] = useState<RefinementBattle[]>([]);

  // Get pending Pokemon from TrueSkill store
  const pendingPokemon = getAllPendingBattles();

  // Convert pending Pokemon into refinement battles
  const refinementQueue = pendingPokemon.map(pokemonId => ({
    primaryPokemonId: pokemonId,
    opponentPokemonId: -1, // Will be filled by battle system
    reason: 'starred'
  }));

  const refinementBattleCount = pendingPokemon.length;
  const hasRefinementBattles = pendingPokemon.length > 0;

  console.log(`🎯 [REFINEMENT_QUEUE_CORE] Current state:`, {
    pendingPokemon,
    refinementBattleCount,
    hasRefinementBattles
  });

  const addValidationBattle = useCallback((primaryPokemonId: number, opponentPokemonId: number) => {
    console.log(`🎯 [REFINEMENT_QUEUE_CORE] addValidationBattle called: ${primaryPokemonId} vs ${opponentPokemonId}`);
    // Add to TrueSkill store
    addPendingBattle(primaryPokemonId);
  }, [addPendingBattle]);

  const queueBattlesForReorder = useCallback(() => {
    console.log(`🎯 [REFINEMENT_QUEUE_CORE] queueBattlesForReorder called`);
    // No-op for now
  }, []);

  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    console.log(`🎯 [REFINEMENT_QUEUE_CORE] getNextRefinementBattle called`);
    console.log(`🎯 [REFINEMENT_QUEUE_CORE] Available pending Pokemon:`, pendingPokemon);
    
    if (pendingPokemon.length === 0) {
      console.log(`🎯 [REFINEMENT_QUEUE_CORE] No pending Pokemon available`);
      return null;
    }

    const nextBattle = {
      primaryPokemonId: pendingPokemon[0],
      opponentPokemonId: -1, // Will be set by battle system
      reason: 'starred'
    };

    console.log(`🎯 [REFINEMENT_QUEUE_CORE] Returning next battle:`, nextBattle);
    return nextBattle;
  }, [pendingPokemon]);

  const popRefinementBattle = useCallback(() => {
    console.log(`🎯 [REFINEMENT_QUEUE_CORE] popRefinementBattle called`);
    
    if (pendingPokemon.length > 0) {
      const pokemonId = pendingPokemon[0];
      console.log(`🎯 [REFINEMENT_QUEUE_CORE] Removing Pokemon ${pokemonId} from pending`);
      removePendingBattle(pokemonId);
    }
  }, [pendingPokemon, removePendingBattle]);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🎯 [REFINEMENT_QUEUE_CORE] clearRefinementQueue called`);
    // Clear all pending Pokemon from TrueSkill store
    clearAllPendingBattles();
  }, [clearAllPendingBattles]);

  return {
    queue,
    refinementQueue,
    refinementBattleCount,
    hasRefinementBattles,
    addValidationBattle,
    queueBattlesForReorder,
    getNextRefinementBattle,
    popRefinementBattle,
    clearRefinementQueue
  };
};
