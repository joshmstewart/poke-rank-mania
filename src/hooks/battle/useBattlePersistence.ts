
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
  saveBattleState: () => void,
  calculateCompletionPercentage: () => void
) => {
  // Calculate completion percentage when results change - no localStorage saving
  useEffect(() => {
    if (allPokemon.length > 0) {
      calculateCompletionPercentage();
      console.log("[BATTLE_PERSISTENCE_CLOUD] Battle state managed in cloud storage only");
    }
  }, [battleResults, allPokemon, selectedGeneration, battleType, calculateCompletionPercentage]);
  
  return {};
};
