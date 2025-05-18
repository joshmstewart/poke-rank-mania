import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, BattleResult, BattleState } from "./types";

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
  saveBattleState: () => void,
  loadBattleState: () => BattleState | null,
  loadPokemon: (genId?: number, preserveState?: boolean) => Promise<void> | Promise<Pokemon[]>,
  calculateCompletionPercentage: () => void
) => {
  // Load saved battle state on mount
  useEffect(() => {
    const savedState = loadBattleState();
    if (savedState) {
      loadPokemon(savedState.selectedGeneration, true);
    } else {
      loadPokemon();
    }
  }, []);

  // Reload when generation changes
  useEffect(() => {
    if (!isLoading) {
      loadPokemon(selectedGeneration, false);
    }
  }, [selectedGeneration, fullRankingMode]);

  // Save battle state when it changes
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

  // Recalculate progress
  useEffect(() => {
    if (allPokemon.length > 0 && battleResults.length > 0) {
      calculateCompletionPercentage();
    }
  }, [battleResults.length, allPokemon.length]);

  return {};
};
