
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleState, BattleType, SingleBattle } from "./types";

export const useBattleCoordinator = (
  isLoading: boolean,
  allPokemon: Pokemon[],
  selectedGeneration: number,
  battleType: BattleType,
  battleResults: SingleBattle[],
  battlesCompleted: number,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  completionPercentage: number,
  fullRankingMode: boolean,
  saveBattleState: (state: BattleState) => void,
  loadBattleState: () => BattleState | null,
  loadPokemon: (genId?: number, fullMode?: boolean, preserveState?: boolean) => Promise<Pokemon[] | void>,
  calculateCompletionPercentage: () => void
) => {
  // Load saved battle state on initial load
  useEffect(() => {
    const savedState = loadBattleState();
    if (savedState) {
      loadPokemon(savedState.selectedGeneration, savedState.fullRankingMode, true);
    } else {
      loadPokemon();
    }
  }, []);

  // Reload Pokémon when generation or ranking mode changes
  useEffect(() => {
    if (!isLoading) {
      loadPokemon(selectedGeneration, fullRankingMode);
    }
  }, [selectedGeneration, fullRankingMode]);

  // Save state and recalculate progress when results change
  useEffect(() => {
    if (allPokemon.length > 0) {
      calculateCompletionPercentage();

      saveBattleState({
        selectedGeneration,
        battleType,
        battleResults,
        battlesCompleted,
        battleHistory,
        completionPercentage,
        fullRankingMode
      });
    }
  }, [
    battleResults,
    allPokemon,
    selectedGeneration,
    battleType,
    battlesCompleted,
    battleHistory,
    completionPercentage,
    fullRankingMode
  ]);

  return {};
};
