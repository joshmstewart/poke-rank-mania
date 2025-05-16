
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, BattleResult } from "./types";

/**
 * Hook for coordinating battle state initialization and persistence
 */
export const useBattleCoordinatorState = (
  isLoading: boolean,
  allPokemon: Pokemon[],
  selectedGeneration: number,
  battleType: BattleType,
  battleResults: BattleResult,
  battlesCompleted: number,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  completionPercentage: number,
  fullRankingMode: boolean,
  saveBattleState: () => void, // Updated to match the signature in useLocalStorage
  loadBattleState: () => any | null,
  loadPokemon: (genId?: number, preserveState?: boolean) => Promise<void>,
  calculateCompletionPercentage: () => void
) => {
  // Load saved battle state on initial load
  useEffect(() => {
    const savedState = loadBattleState();
    if (savedState) {
      // We'll load the Pokemon separately based on the saved generation
      loadPokemon(savedState.selectedGeneration, true);
    } else {
      loadPokemon();
    }
  }, []);

  // Reload Pokemon when generation changes
  useEffect(() => {
    // Only reload Pokemon if generation changes and not during initial loading
    if (!isLoading) {
      loadPokemon(selectedGeneration, false);
    }
  }, [selectedGeneration, fullRankingMode]);

  // Save battle state whenever it changes
  useEffect(() => {
    if (!isLoading && allPokemon.length > 0) {
      saveBattleState();
    }
  }, [
    selectedGeneration,
    battleType,
    battleResults.length,
    battlesCompleted,
    battleHistory.length,
    completionPercentage,
    fullRankingMode
  ]);

  // Calculate completion percentage when battle results change
  useEffect(() => {
    if (allPokemon.length > 0 && battleResults.length > 0) {
      calculateCompletionPercentage();
    }
  }, [battleResults.length, allPokemon.length]);

  return {};
};
