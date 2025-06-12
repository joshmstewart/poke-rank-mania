
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
    syncToCloud
  } = useTrueSkillStore();

  console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Hook initialized - hydrated: ${isHydrated}`);

  const addPendingPokemon = useCallback((pokemonId: number) => {
    const addId = `ADD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔥🔥🔥 [${addId}] ===== ADDING POKEMON ${pokemonId} =====`);
    console.log(`🔥🔥🔥 [${addId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔥🔥🔥 [${addId}] Current pending before add:`, getAllPendingBattles());
    
    addPendingBattle(pokemonId);
    
    const afterAdd = getAllPendingBattles();
    console.log(`🔥🔥🔥 [${addId}] Current pending after add:`, afterAdd);
    console.log(`🔥🔥🔥 [${addId}] Successfully added: ${afterAdd.includes(pokemonId)}`);
    
    // PHASE 4: Ensure immediate sync for critical pending operations
    console.log(`🔥🔥🔥 [${addId}] Forcing immediate sync after adding pending Pokemon`);
    syncToCloud();
    
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
  }, [addPendingBattle, getAllPendingBattles, syncToCloud]);

  const removePendingPokemon = useCallback((pokemonId: number) => {
    const removeId = `REMOVE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔥🔥🔥 [${removeId}] ===== REMOVING POKEMON ${pokemonId} =====`);
    console.log(`🔥🔥🔥 [${removeId}] Current pending before remove:`, getAllPendingBattles());
    removePendingBattle(pokemonId);
    
    const afterRemove = getAllPendingBattles();
    console.log(`🔥🔥🔥 [${removeId}] Current pending after remove:`, afterRemove);
    
    // PHASE 4: Ensure immediate sync for critical pending operations
    console.log(`🔥🔥🔥 [${removeId}] Forcing immediate sync after removing pending Pokemon`);
    syncToCloud();
  }, [removePendingBattle, getAllPendingBattles, syncToCloud]);

  const clearAllPending = useCallback(() => {
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] ===== CLEARING ALL PENDING =====`);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Current pending before clear:`, getAllPendingBattles());
    clearAllPendingBattles();
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Current pending after clear:`, getAllPendingBattles());
    
    // PHASE 4: Ensure immediate sync
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Forcing immediate sync after clearing all pending`);
    syncToCloud();
  }, [clearAllPendingBattles, getAllPendingBattles, syncToCloud]);

  const getAllPendingIds = useCallback((): number[] => {
    const ids = getAllPendingBattles();
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] ===== GET ALL PENDING IDS =====`);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Raw result:`, ids);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Type:`, typeof ids);
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Is Array:`, Array.isArray(ids));
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Length:`, ids?.length || 'undefined');
    if (Array.isArray(ids)) {
      console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Individual items:`, ids.map(id => `${id}(${typeof id})`));
      
      // DEBUG: Check if the first few IDs match what the cards are checking
      const firstFew = ids.slice(0, 5);
      console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] 🔍 CHECKING FIRST FEW IDS:`, firstFew);
      firstFew.forEach(id => {
        const pendingCheck = isPokemonPending(id);
        console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] 🔍 isPokemonPending(${id}): ${pendingCheck}`);
        console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] 🔍 ID type: ${typeof id}, value: ${id}`);
      });
    }
    return ids || [];
  }, [getAllPendingBattles, isPokemonPending]);

  const hasPendingPokemon = getAllPendingBattles().length > 0;

  // PHASE 2: Enhanced hydration monitoring
  useEffect(() => {
    if (getAllPendingBattles().length > 0 && !isHydrated) {
      console.warn(
        '[CLOUD_PENDING_PHASE2] Pending battles present but isHydrated is false. Forcing hydration.'
      );
      useTrueSkillStore.setState({ isHydrated: true });
    }
  }, [isHydrated, getAllPendingBattles]);

  // Debug render with enhanced logging
  console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Hook render:`, {
    hasPendingPokemon,
    pendingCount: getAllPendingBattles().length,
    pendingIds: getAllPendingBattles(),
    isHydrated,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log(`🔥🔥🔥 [CLOUD_PENDING_PHASE2] Hydration status changed: ${isHydrated}`);
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
