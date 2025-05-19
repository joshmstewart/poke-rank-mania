
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleState, BattleType, SingleBattle } from "./types";

export const useBattlePersistence = (
  allPokemon: Pokemon[],
  selectedGeneration: number,
  battleType: BattleType,
  battleResults: SingleBattle[],
  battlesCompleted: number,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  completionPercentage: number,
  fullRankingMode: boolean,
  saveBattleState: () => void, // Updated to match useLocalStorage
  calculateCompletionPercentage: () => void
) => {
  // Calculate completion percentage and save state when results change
  useEffect(() => {
    // Calculate completion percentage when battle results change
    if (allPokemon.length > 0) {
      calculateCompletionPercentage();
      
      // Save battle state whenever results change
      saveBattleState();
    }
  }, [battleResults, allPokemon, selectedGeneration, battleType]);
  
  return {};
};
