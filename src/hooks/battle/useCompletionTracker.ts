
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult, BattleType } from "./types";

export const useCompletionTracker = (
  allPokemon: Pokemon[],
  battleResults: BattleResult,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: BattleResult) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>
) => {
  const calculateCompletionPercentage = () => {
    // For a complete ranking in a tournament style, we need at least n-1 comparisons
    // where n is the number of Pokémon
    const totalPokemon = allPokemon.length;
    
    if (totalPokemon <= 1) {
      setCompletionPercentage(100);
      return;
    }
    
    // Minimum number of comparisons needed for a complete ranking
    const minimumComparisons = totalPokemon - 1;
    
    // For pairs, each battle gives us 1 comparison
    // For triplets, each battle can give us multiple comparisons depending on selections
    const currentComparisons = battleResults.length;
    
    // Calculate percentage (cap at 100%)
    const percentage = Math.min(100, Math.floor((currentComparisons / minimumComparisons) * 100));
    setCompletionPercentage(percentage);
    
    // If we've reached 100%, make sure to show the final rankings
    if (percentage >= 100) {
      generateRankings(battleResults);
      setRankingGenerated(true);
    }
  };

  // Modified to return a number without requiring battleType parameter
  const getBattlesRemaining = () => {
    if (allPokemon.length <= 1) return 0;
    
    const totalPokemon = allPokemon.length;
    const minimumComparisons = totalPokemon - 1;
    const currentComparisons = battleResults.length;
    
    // Just return the remaining comparisons as a simple estimate
    return Math.max(0, minimumComparisons - currentComparisons);
  };

  return {
    setCompletionPercentage,
    calculateCompletionPercentage,
    getBattlesRemaining
  };
};
