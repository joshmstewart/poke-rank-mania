
import { useCallback, useEffect } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';

// PERF: use Zustand selectors so consumers only re-render when the slices
// they actually care about change. The previous destructure subscribed to
// the ENTIRE store, causing every mounted card (~1100 in manual mode) to
// re-render on any TrueSkill update (scores, sync, etc).
export const useCloudPendingBattles = () => {
  const pendingBattles = useTrueSkillStore((s) => s.pendingBattles);
  const isHydrated = useTrueSkillStore((s) => s.isHydrated);

  const addPendingPokemon = useCallback((pokemonId: number) => {
    useTrueSkillStore.getState().addPendingBattle(pokemonId);
    document.dispatchEvent(
      new CustomEvent('pokemon-starred-for-battle', {
        detail: { pokemonId, source: 'cloud-pending-battles', timestamp: Date.now() },
      })
    );
  }, []);

  const removePendingPokemon = useCallback((pokemonId: number) => {
    useTrueSkillStore.getState().removePendingBattle(pokemonId);
  }, []);

  const clearAllPending = useCallback(() => {
    useTrueSkillStore.getState().clearAllPendingBattles();
  }, []);

  const isPokemonPending = useCallback(
    (pokemonId: number) => pendingBattles.includes(pokemonId),
    [pendingBattles]
  );

  const getAllPendingIds = useCallback((): number[] => pendingBattles, [pendingBattles]);
  const hasPendingPokemon = pendingBattles.length > 0;

  useEffect(() => {
    if (pendingBattles.length > 0 && !isHydrated) {
      useTrueSkillStore.setState({ isHydrated: true });
    }
  }, [pendingBattles, isHydrated]);

  return {
    pendingPokemon: pendingBattles,
    addPendingPokemon,
    removePendingPokemon,
    clearAllPending,
    isPokemonPending,
    getAllPendingIds,
    hasPendingPokemon,
    isHydrated,
  };
};
