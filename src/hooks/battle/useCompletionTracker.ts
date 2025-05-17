
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
  
  // Force calculation on mount and when battle results change
  useEffect(() => {
    calculateCompletionPercentage();
  }, [battleResults?.length]);

  // Calculate completion percentage and check if we should show rankings
  const calculateCompletionPercentage = () => {
    // For a complete ranking in a tournament style, we need at least n-1 comparisons
    // where n is the number of Pokémon. This is the minimum number of comparisons
    // needed to sort a list (optimal comparison-based sorting algorithms).
    const totalPokemon = allPokemon?.length || 0;
    
    console.log(`[useCompletionTracker] Calculating completion: ${totalPokemon} total Pokémon, ${battleResults?.length || 0} battles completed`);
    
    if (!totalPokemon || totalPokemon <= 1) {
      setCompletionPercentage(100);
      return;
    }
    
    // Minimum number of comparisons needed for a basic ranking
    // We'll use a simple formula for battles needed to get a basic ranking:
    // For ranking purposes, we want at least 10% of possible comparisons
    const currentComparisons = battleResults?.length || 0;
    
    // For early milestones, we want to show some progress even with few battles
    let percentage;
    
    if (currentComparisons < 10) {
      // For the first few battles, show small but noticeable progress
      percentage = Math.round(currentComparisons / 10 * 5); // Max 5% for first 10 battles
    } else if (currentComparisons < 50) {
      // Between 10-50 battles, scale from 5% to 25%
      percentage = 5 + Math.round((currentComparisons - 10) / 40 * 20); 
    } else if (currentComparisons < 100) {
      // Between 50-100 battles, scale from 25% to 50%
      percentage = 25 + Math.round((currentComparisons - 50) / 50 * 25);
    } else {
      // After 100 battles, scale more gradually
      // n*log2(n) is a reasonable estimate for the number of comparisons needed for a good ranking
      const logBase2 = Math.log(totalPokemon) / Math.log(2);
      const estimatedComparisonsForFullRanking = Math.ceil(totalPokemon * logBase2);
      const maxComparisons = Math.min(estimatedComparisonsForFullRanking, 500); // Cap at 500 to avoid requiring too many battles
      
      // Beyond 100 battles, scale from 50% to 100%
      const remainingPercentage = 50;
      const remainingComparisons = maxComparisons - 100;
      const additionalPercentage = Math.min(
        remainingPercentage,
        Math.round(((currentComparisons - 100) / remainingComparisons) * remainingPercentage)
      );
      
      percentage = 50 + additionalPercentage;
    }
    
    // Cap at 100%
    percentage = Math.min(100, percentage);
    
    console.log(`[useCompletionTracker] Calculated ${percentage}% completion (${currentComparisons} battles)`);
    setCompletionPercentage(percentage);
    
    // If we've reached 100%, make sure to show the final rankings
    if (percentage >= 100 && !currentRankingGenerated) {
      console.log("[useCompletionTracker] 100% completion reached - generating final rankings");
      generateRankings(battleResults);
      setRankingGenerated(true);
      setCurrentRankingGenerated(true);
      
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

  // Calculate remaining battles
  const getBattlesRemaining = () => {
    if (!allPokemon || allPokemon.length <= 1) return 0;
    
    const totalPokemon = allPokemon.length;
    // Use n*log(n) as our estimate for comparisons needed
    const logBase2 = Math.log(totalPokemon) / Math.log(2);
    const minimumComparisons = Math.ceil(totalPokemon * logBase2);
    const currentComparisons = battleResults?.length || 0;
    
    // Return the remaining comparisons as a simple estimate
    return Math.max(0, minimumComparisons - currentComparisons);
  };

  return {
    setCompletionPercentage,
    calculateCompletionPercentage,
    getBattlesRemaining
  };
};
