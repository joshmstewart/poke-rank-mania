
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
  // Load saved battle state on initial load with safety timeouts
  useEffect(() => {
    let isMounted = true;
    const initializationTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.error("Initialization timed out - forcing state to not loading");
        toast({
          title: "Loading took too long",
          description: "Resetting application state. Please try again.",
          variant: "destructive"
        });
      }
    }, 10000); // 10-second safety timeout
    
    const initializeApp = async () => {
      try {
        const savedState = loadBattleState();
        if (savedState && isMounted) {
          await loadPokemon(savedState.selectedGeneration, savedState.fullRankingMode, true);
        } else if (isMounted) {
          await loadPokemon();
        }
      } catch (error) {
        console.error("Failed to initialize battle state:", error);
        if (isMounted) {
          toast({
            title: "Error loading battle data",
            description: "Please try refreshing the page.",
            variant: "destructive"
          });
        }
      }
    };
    
    initializeApp();
    
    return () => {
      isMounted = false;
      clearTimeout(initializationTimeout);
    };
  }, []);

  // Reload Pokémon when generation or ranking mode changes
  useEffect(() => {
    let isMounted = true;
    const reloadPokemon = async () => {
      if (!isLoading && isMounted) {
        try {
          await loadPokemon(selectedGeneration, fullRankingMode);
        } catch (error) {
          console.error("Failed to reload Pokémon data:", error);
        }
      }
    };
    
    reloadPokemon();
    
    return () => {
      isMounted = false;
    };
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
