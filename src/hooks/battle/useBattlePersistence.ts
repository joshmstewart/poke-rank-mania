
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleState, BattleType } from "./types";

export const useBattlePersistence = (
  allPokemon: Pokemon[],
  selectedGeneration: number,
  battleType: BattleType,
  battleResults: BattleResult,
  battlesCompleted: number,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  completionPercentage: number,
  fullRankingMode: boolean,
  saveBattleState: (state: BattleState) => void,
  calculateCompletionPercentage: () => void
) => {
  // Calculate completion percentage and save state when results change
  useEffect(() => {
    // Calculate completion percentage when battle results change
    if (allPokemon.length > 0) {
      calculateCompletionPercentage();
      
      // Save battle state whenever results change
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
  }, [battleResults, allPokemon, selectedGeneration, battleType]);
  
  return {};
};
