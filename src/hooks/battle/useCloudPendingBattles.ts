
import { useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';

export const useCloudPendingBattles = () => {
  const {
    addPendingBattle,
    removePendingBattle,
    clearAllPendingBattles,
    isPokemonPending,
    getAllPendingBattles,
    isHydrated
  } = useTrueSkillStore();

  console.log(`🌥️ [CLOUD_PENDING_HOOK] Hook initialized - hydrated: ${isHydrated}`);

  const addPendingPokemon = useCallback((pokemonId: number) => {
    console.log(`🌥️ [CLOUD_PENDING_HOOK] ===== ADDING POKEMON ${pokemonId} =====`);
    console.log(`🌥️ [CLOUD_PENDING_HOOK] Timestamp: ${new Date().toISOString()}`);
    
    addPendingBattle(pokemonId);
    
    // Dispatch immediate event to notify system
    const eventDetail = { 
      pokemonId,
      source: 'cloud-pending-battles',
      timestamp: Date.now()
    };
    
    console.log(`🌥️ [CLOUD_PENDING_HOOK] Dispatching pokemon-starred-for-battle event:`, eventDetail);
    const event = new CustomEvent('pokemon-starred-for-battle', {
      detail: eventDetail
    });
    document.dispatchEvent(event);
    console.log(`🌥️ [CLOUD_PENDING_HOOK] ✅ Event dispatched successfully`);
  }, [addPendingBattle]);

  const removePendingPokemon = useCallback((pokemonId: number) => {
    console.log(`🌥️ [CLOUD_PENDING_HOOK] ===== REMOVING POKEMON ${pokemonId} =====`);
    removePendingBattle(pokemonId);
  }, [removePendingBattle]);

  const clearAllPending = useCallback(() => {
    console.log(`🌥️ [CLOUD_PENDING_HOOK] ===== CLEARING ALL PENDING =====`);
    clearAllPendingBattles();
  }, [clearAllPendingBattles]);

  const getAllPendingIds = useCallback((): number[] => {
    const ids = getAllPendingBattles();
    console.log(`🌥️ [CLOUD_PENDING_HOOK] ===== GET ALL PENDING IDS =====`);
    console.log(`🌥️ [CLOUD_PENDING_HOOK] Returning:`, ids);
    console.log(`🌥️ [CLOUD_PENDING_HOOK] Count:`, ids.length);
    return ids;
  }, [getAllPendingBattles]);

  const hasPendingPokemon = getAllPendingBattles().length > 0;

  // Debug render
  console.log(`🌥️ [CLOUD_PENDING_HOOK] Hook render:`, {
    hasPendingPokemon,
    pendingCount: getAllPendingBattles().length,
    isHydrated
  });

  return {
    pendingPokemon: getAllPendingBattles(),
    addPendingPokemon,
    removePendingPokemon,
    clearAllPending,
    isPokemonPending,
    getAllPendingIds,
    hasPendingPokemon,
    isHydrated
  };
};
