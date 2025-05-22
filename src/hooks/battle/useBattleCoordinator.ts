
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleState, BattleType, SingleBattle } from "./types";
import { toast } from "@/hooks/use-toast";

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
    const initializeApp = async () => {
      try {
        const savedState = loadBattleState();
        if (savedState) {
          await loadPokemon(savedState.selectedGeneration, savedState.fullRankingMode, true);
        } else {
          await loadPokemon();
        }
      } catch (error) {
        console.error("Failed to initialize battle state:", error);
        toast({
          title: "Error loading battle data",
          description: "Please try refreshing the page.",
          variant: "destructive"
        });
      }
    };
    
    initializeApp();
  }, []);

  // Reload Pokémon when generation or ranking mode changes
  useEffect(() => {
    const reloadPokemon = async () => {
      if (!isLoading) {
        try {
          await loadPokemon(selectedGeneration, fullRankingMode);
        } catch (error) {
          console.error("Failed to reload Pokémon data:", error);
        }
      }
    };
    
    reloadPokemon();
  }, [selectedGeneration, fullRankingMode]);

  // Save state and recalculate progress when results change
  useEffect(() => {
    if (allPokemon.length > 0) {
      calculateCompletionPercentage();

      // Only attempt to save the state when we have valid data
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
