
import { useState, useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string;
}

export const useRefinementQueue = () => {
  console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] Hook initialized`);
  
  // CRITICAL FIX: Use TrueSkill store as the single source of truth
  const { 
    getAllPendingBattles, 
    removePendingBattle, 
    isPokemonPending,
    addPendingBattle,
    clearAllPendingBattles,
    smartSync
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

  console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] Current state:`, {
    pendingPokemon,
    refinementBattleCount,
    hasRefinementBattles
  });

  const addValidationBattle = useCallback((primaryPokemonId: number, opponentPokemonId: number) => {
    console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] addValidationBattle called: ${primaryPokemonId} vs ${opponentPokemonId}`);
    // Add to TrueSkill store
    addPendingBattle(primaryPokemonId);
  }, [addPendingBattle]);

  const queueBattlesForReorder = useCallback(() => {
    console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] queueBattlesForReorder called`);
    // No-op for now
  }, []);

  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] getNextRefinementBattle called`);
    console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] Available pending Pokemon:`, pendingPokemon);
    
    if (pendingPokemon.length === 0) {
      console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] No pending Pokemon available`);
      return null;
    }

    const nextBattle = {
      primaryPokemonId: pendingPokemon[0],
      opponentPokemonId: -1, // Will be set by battle system
      reason: 'starred'
    };

    console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] Returning next battle:`, nextBattle);
    return nextBattle;
  }, [pendingPokemon]);

  const popRefinementBattle = useCallback(async () => {
    console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] ===== POP REFINEMENT BATTLE CALLED =====`);
    
    if (pendingPokemon.length > 0) {
      const pokemonId = pendingPokemon[0];
      console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] REMOVING Pokemon ${pokemonId} from pending list`);
      console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] Before removal - pending count: ${pendingPokemon.length}`);
      
      // CRITICAL FIX: Remove from TrueSkill store and ensure it persists
      removePendingBattle(pokemonId);
      
      // CRITICAL FIX: Force immediate sync to cloud to persist the removal
      try {
        console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] Triggering immediate cloud sync for persistence`);
        await smartSync();
        console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] ✅ Cloud sync successful - removal persisted`);
      } catch (error) {
        console.error(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] ❌ Cloud sync failed:`, error);
      }
      
      console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] Pokemon ${pokemonId} removal complete`);
    } else {
      console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] No pending Pokemon to remove`);
    }
  }, [pendingPokemon, removePendingBattle, smartSync]);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🎯🔧🔧🔧 [REFINEMENT_QUEUE_MEGA_FIX] clearRefinementQueue called`);
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
