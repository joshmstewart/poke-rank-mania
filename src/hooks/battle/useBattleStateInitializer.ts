
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useEffect } from "react";

export const useBattleStateInitializer = (
  isLoading: boolean,
  allPokemon: Pokemon[],
  selectedGeneration: number,
  battleType: BattleType,
  fullRankingMode: boolean,
  loadBattleState: () => any | null,
  loadPokemon: (genId?: number, fullMode?: boolean, preserveState?: boolean) => Promise<Pokemon[]>,
) => {
  // Load saved battle state on initial load
  useEffect(() => {
    const savedState = loadBattleState();
    if (savedState) {
      // We'll load the Pokemon separately based on the saved generation
      loadPokemon(savedState.selectedGeneration, savedState.fullRankingMode, true);
    } else {
      loadPokemon();
    }
  }, []);

  // Reload Pokemon when generation or ranking mode changes
  useEffect(() => {
    // Only reload Pokemon if generation changes and not during initial loading
    if (!isLoading) {
      loadPokemon(selectedGeneration, fullRankingMode);
    }
  }, [selectedGeneration, fullRankingMode]);
  
  return {};
};
