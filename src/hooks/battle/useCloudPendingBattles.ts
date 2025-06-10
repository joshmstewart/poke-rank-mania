
import { useCallback, useEffect } from 'react';
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

  console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Hook initialized - hydrated: ${isHydrated}`);

  const addPendingPokemon = useCallback((pokemonId: number) => {
    const addId = `ADD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔥🔥🔥 [${addId}] ===== ADDING POKEMON ${pokemonId} =====`);
    console.log(`🔥🔥🔥 [${addId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔥🔥🔥 [${addId}] Current pending before add:`, getAllPendingBattles());
    
    addPendingBattle(pokemonId);
    
    const afterAdd = getAllPendingBattles();
    console.log(`🔥🔥🔥 [${addId}] Current pending after add:`, afterAdd);
    console.log(`🔥🔥🔥 [${addId}] Successfully added: ${afterAdd.includes(pokemonId)}`);
    
    // Dispatch immediate event to notify system
    const eventDetail = { 
      pokemonId,
      source: 'cloud-pending-battles',
      timestamp: Date.now(),
      addId: addId
    };
    
    console.log(`🔥🔥🔥 [${addId}] Dispatching pokemon-starred-for-battle event:`, eventDetail);
    const event = new CustomEvent('pokemon-starred-for-battle', {
      detail: eventDetail
    });
    document.dispatchEvent(event);
    console.log(`🔥🔥🔥 [${addId}] ✅ Event dispatched successfully`);
  }, [addPendingBattle, getAllPendingBattles]);

  const removePendingPokemon = useCallback((pokemonId: number) => {
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] ===== REMOVING POKEMON ${pokemonId} =====`);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Current pending before remove:`, getAllPendingBattles());
    removePendingBattle(pokemonId);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Current pending after remove:`, getAllPendingBattles());
  }, [removePendingBattle, getAllPendingBattles]);

  const clearAllPending = useCallback(() => {
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] ===== CLEARING ALL PENDING =====`);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Current pending before clear:`, getAllPendingBattles());
    clearAllPendingBattles();
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Current pending after clear:`, getAllPendingBattles());
  }, [clearAllPendingBattles, getAllPendingBattles]);

  const getAllPendingIds = useCallback((): number[] => {
    const ids = getAllPendingBattles();
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] ===== GET ALL PENDING IDS =====`);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Raw result:`, ids);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Type:`, typeof ids);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Is Array:`, Array.isArray(ids));
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Length:`, ids.length);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Individual items:`, ids.map(id => `${id}(${typeof id})`));
    return ids;
  }, [getAllPendingBattles]);

  const hasPendingPokemon = getAllPendingBattles().length > 0;

  // If we somehow loaded pending battles but hydration flag is false, fix it
  useEffect(() => {
    if (getAllPendingBattles().length > 0 && !isHydrated) {
      console.warn(
        '[CLOUD_PENDING_HOOK] Pending battles present but isHydrated is false. Forcing hydration.'
      );
      useTrueSkillStore.setState({ isHydrated: true });
    }
  }, [isHydrated, getAllPendingBattles]);

  // Debug render
  console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Hook render:`, {
    hasPendingPokemon,
    pendingCount: getAllPendingBattles().length,
    pendingIds: getAllPendingBattles(),
    isHydrated,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Hydration status changed: ${isHydrated}`);
  }, [isHydrated]);

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
