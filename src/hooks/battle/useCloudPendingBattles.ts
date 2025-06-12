
import { useCallback, useEffect } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';

export const useCloudPendingBattles = () => {
  const {
    addPendingBattle,
    removePendingBattle,
    clearAllPendingBattles,
    isPokemonPending,
    getAllPendingBattles,
    isHydrated,
    smartSync
  } = useTrueSkillStore();

  console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Hook initialized - hydrated: ${isHydrated}`);

  const addPendingPokemon = useCallback(async (pokemonId: number) => {
    const addId = `ADD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔥🔥🔥 [${addId}] ===== ADDING POKEMON ${pokemonId} =====`);
    console.log(`🔥🔥🔥 [${addId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔥🔥🔥 [${addId}] Current pending before add:`, getAllPendingBattles());
    
    addPendingBattle(pokemonId);
    
    // CRITICAL FIX: Force immediate sync to cloud after adding
    try {
      console.log(`🔥🔥🔥 [${addId}] Forcing immediate cloud sync after add`);
      await smartSync();
      console.log(`🔥🔥🔥 [${addId}] ✅ Cloud sync successful after add`);
    } catch (error) {
      console.error(`🔥🔥🔥 [${addId}] ❌ Cloud sync failed after add:`, error);
    }
    
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
  }, [addPendingBattle, getAllPendingBattles, smartSync]);

  const removePendingPokemon = useCallback(async (pokemonId: number) => {
    const removeId = `REMOVE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔥🔥🔥 [${removeId}] ===== REMOVING POKEMON ${pokemonId} =====`);
    console.log(`🔥🔥🔥 [${removeId}] Current pending before remove:`, getAllPendingBattles());
    
    removePendingBattle(pokemonId);
    
    // CRITICAL FIX: Force immediate sync to cloud after removing
    try {
      console.log(`🔥🔥🔥 [${removeId}] Forcing immediate cloud sync after remove`);
      await smartSync();
      console.log(`🔥🔥🔥 [${removeId}] ✅ Cloud sync successful after remove`);
    } catch (error) {
      console.error(`🔥🔥🔥 [${removeId}] ❌ Cloud sync failed after remove:`, error);
    }
    
    console.log(`🔥🔥🔥 [${removeId}] Current pending after remove:`, getAllPendingBattles());
    
    // Dispatch event to notify system of removal
    const eventDetail = { 
      pokemonId,
      source: 'cloud-pending-battles',
      timestamp: Date.now(),
      removeId: removeId,
      action: 'remove'
    };
    
    console.log(`🔥🔥🔥 [${removeId}] Dispatching pokemon-unstarred event:`, eventDetail);
    const event = new CustomEvent('pokemon-unstarred', {
      detail: eventDetail
    });
    document.dispatchEvent(event);
    console.log(`🔥🔥🔥 [${removeId}] ✅ Unstar event dispatched successfully`);
  }, [removePendingBattle, getAllPendingBattles, smartSync]);

  const clearAllPending = useCallback(async () => {
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] ===== CLEARING ALL PENDING =====`);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Current pending before clear:`, getAllPendingBattles());
    
    clearAllPendingBattles();
    
    // CRITICAL FIX: Force immediate sync to cloud after clearing
    try {
      console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Forcing immediate cloud sync after clear`);
      await smartSync();
      console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] ✅ Cloud sync successful after clear`);
    } catch (error) {
      console.error(`🔥🔥🔥 [CLOUD_PENDING_HOOK] ❌ Cloud sync failed after clear:`, error);
    }
    
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Current pending after clear:`, getAllPendingBattles());
  }, [clearAllPendingBattles, getAllPendingBattles, smartSync]);

  const getAllPendingIds = useCallback((): number[] => {
    const ids = getAllPendingBattles();
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] ===== GET ALL PENDING IDS =====`);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Raw result:`, ids);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Type:`, typeof ids);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Is Array:`, Array.isArray(ids));
    console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Length:`, ids?.length || 'undefined');
    if (Array.isArray(ids)) {
      console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] Individual items:`, ids.map(id => `${id}(${typeof id})`));
      
      // DEBUG: Check if the first few IDs match what the cards are checking
      const firstFew = ids.slice(0, 5);
      console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] 🔍 CHECKING FIRST FEW IDS:`, firstFew);
      firstFew.forEach(id => {
        const pendingCheck = isPokemonPending(id);
        console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] 🔍 isPokemonPending(${id}): ${pendingCheck}`);
        console.log(`🔥🔥🔥 [CLOUD_PENDING_HOOK] 🔍 ID type: ${typeof id}, value: ${id}`);
      });
    }
    return ids || [];
  }, [getAllPendingBattles, isPokemonPending]);

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
