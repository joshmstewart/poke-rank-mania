
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

  const addPendingPokemon = useCallback((pokemonId: number) => {
    addPendingBattle(pokemonId);
    
    const eventDetail = { 
      pokemonId,
      source: 'cloud-pending-battles',
      timestamp: Date.now()
    };
    
    const event = new CustomEvent('pokemon-starred-for-battle', {
      detail: eventDetail
    });
    document.dispatchEvent(event);
  }, [addPendingBattle]);

  const removePendingPokemon = useCallback((pokemonId: number) => {
    removePendingBattle(pokemonId);
  }, [removePendingBattle]);

  const clearAllPending = useCallback(() => {
    clearAllPendingBattles();
  }, [clearAllPendingBattles]);

  const getAllPendingIds = useCallback((): number[] => {
    return getAllPendingBattles() || [];
  }, [getAllPendingBattles]);

  const hasPendingPokemon = getAllPendingBattles().length > 0;

  useEffect(() => {
    if (getAllPendingBattles().length > 0 && !isHydrated) {
      useTrueSkillStore.setState({ isHydrated: true });
    }
  }, [isHydrated, getAllPendingBattles]);

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
