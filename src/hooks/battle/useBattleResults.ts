
import { useState, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";

export const useBattleResults = () => {
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]); 

  // This hook now only manages battle result storage
  // Ranking generation is handled by the TrueSkill system in useRankingCalculator
  const getCurrentRankings = useCallback((): RankedPokemon[] => {
    // Return empty array - rankings should come from the TrueSkill system
    console.log("[useBattleResults] getCurrentRankings called - delegating to TrueSkill system");
    return [];
  }, []);

  return {
    battleResults,
    setBattleResults,
    getCurrentRankings
  };
};
