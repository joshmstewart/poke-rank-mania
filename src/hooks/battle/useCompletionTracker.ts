
import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult } from "./types";
import { toast } from "@/hooks/use-toast";

export const useCompletionTracker = (
  allPokemon: Pokemon[],
  battleResults: BattleResult,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: BattleResult) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>
) => {
  // Track if we've already generated a complete ranking to avoid showing the toast multiple times
  const [currentRankingGenerated, setCurrentRankingGenerated] = useState(false);

  const calculateCompletionPercentage = () => {
    // For a complete ranking in a tournament style, we need at least n-1 comparisons
    // where n is the number of Pokémon. This is the minimum number of comparisons
    // needed to sort a list (optimal comparison-based sorting algorithms).
    // We don't need to compare every possible pair, which would be n*(n-1)/2.
    const totalPokemon = allPokemon.length;
    
    if (totalPokemon <= 1) {
      setCompletionPercentage(100);
      return;
    }
    
    // Minimum number of comparisons needed for a complete ranking
    // This is based on sort theory - you need at least n-1 comparisons
    // to fully sort n items (in the best case)
    const minimumComparisons = totalPokemon - 1;
    
    // For pairs, each battle gives us 1 comparison
    // For triplets, each battle can give us multiple comparisons depending on selections
    // In both cases, battleResults stores each individual comparison
    const currentComparisons = battleResults.length;
    
    // Calculate percentage (cap at 100%)
    const percentage = Math.min(100, Math.floor((currentComparisons / minimumComparisons) * 100));
    setCompletionPercentage(percentage);
    
    // If we've reached 100%, make sure to show the final rankings
    if (percentage >= 100 && !currentRankingGenerated) {
      generateRankings(battleResults);
      setRankingGenerated(true);
      
      // Show a toast to inform the user they've reached 100%
      toast({
        title: "Complete Ranking Achieved!",
        description: "You've completed enough battles to generate a full ranking of all Pokémon!",
        variant: "default"
      });
    }
  };

  // Update the local state when the ranking is generated
  useEffect(() => {
    // Check if ranking is generated 
    if (setRankingGenerated) {
      setCurrentRankingGenerated(true);
    }
  }, [setRankingGenerated]);

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
