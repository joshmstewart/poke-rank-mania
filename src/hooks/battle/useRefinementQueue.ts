
import { useState, useCallback } from 'react';
import { usePersistentPendingState } from './usePersistentPendingState';

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string;
}

export const useRefinementQueue = () => {
  console.log(`🎯 [REFINEMENT_QUEUE_CORE] Hook initialized`);
  
  // Use the pending Pokemon system as the source of truth
  const { pendingPokemon, removePendingPokemon, hasPendingPokemon } = usePersistentPendingState();
  
  const [queue, setQueue] = useState<RefinementBattle[]>([]);

  // Convert pending Pokemon into refinement battles
  const refinementQueue = pendingPokemon.map(pokemonId => ({
    primaryPokemonId: pokemonId,
    opponentPokemonId: -1, // Will be filled by battle system
    reason: 'starred'
  }));

  const refinementBattleCount = pendingPokemon.length;
  const hasRefinementBattles = hasPendingPokemon;

  console.log(`🎯 [REFINEMENT_QUEUE_CORE] Current state:`, {
    pendingPokemon,
    refinementBattleCount,
    hasRefinementBattles
  });

  const addValidationBattle = useCallback((primaryPokemonId: number, opponentPokemonId: number) => {
    console.log(`🎯 [REFINEMENT_QUEUE_CORE] addValidationBattle called: ${primaryPokemonId} vs ${opponentPokemonId}`);
    // This is handled by the pending system when starring
  }, []);

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
      removePendingPokemon(pokemonId);
    }
  }, [pendingPokemon, removePendingPokemon]);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🎯 [REFINEMENT_QUEUE_CORE] clearRefinementQueue called`);
    // Clear all pending Pokemon
    pendingPokemon.forEach(pokemonId => {
      removePendingPokemon(pokemonId);
    });
  }, [pendingPokemon, removePendingPokemon]);

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
