
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleState, BattleType } from "./types";

export const useBattleEffects = (
  isLoading: boolean,
  allPokemon: Pokemon[],
  selectedGeneration: number,
  battleType: BattleType,
  battleResults: BattleResult,
  battlesCompleted: number,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  completionPercentage: number,
  fullRankingMode: boolean,
  saveBattleState: () => void, // Updated to match useLocalStorage
  loadBattleState: () => BattleState | null,
  loadPokemon: (genId?: number, fullMode?: boolean, preserveState?: boolean) => Promise<Pokemon[]>,
  calculateCompletionPercentage: () => void
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

  // Calculate completion percentage and save state when results change
  useEffect(() => {
    // Calculate completion percentage when battle results change
    if (allPokemon.length > 0) {
      calculateCompletionPercentage();
      
      // Save battle state whenever results change
      saveBattleState();
    }
  }, [battleResults, allPokemon, selectedGeneration, battleType]);
};
