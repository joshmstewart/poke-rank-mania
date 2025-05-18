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
  const [currentRankingGenerated, setCurrentRankingGenerated] = useState(false);

  useEffect(() => {
    calculateCompletionPercentage();
  }, [battleResults?.length]);

  const calculateCompletionPercentage = () => {
    const totalPokemon = allPokemon?.length || 0;
    if (totalPokemon <= 1) {
      setCompletionPercentage(100);
      return;
    }

    // Build a map of each Pokémon ID → set of opponents it's been compared to
    const comparisonMap: Map<number, Set<number>> = new Map();

    for (const { winner, loser } of battleResults) {
      if (!comparisonMap.has(winner.id)) {
        comparisonMap.set(winner.id, new Set());
      }
      if (!comparisonMap.has(loser.id)) {
        comparisonMap.set(loser.id, new Set());
      }
      comparisonMap.get(winner.id)!.add(loser.id);
      comparisonMap.get(loser.id)!.add(winner.id);
    }

    // Count how many Pokémon have enough comparisons
    const threshold = Math.floor(totalPokemon * 0.3); // e.g. must be compared to 30% of others
    let countAboveThreshold = 0;

    for (const pokemon of allPokemon) {
      const comparedTo = comparisonMap.get(pokemon.id);
      if (comparedTo && comparedTo.size >= threshold) {
        countAboveThreshold++;
      }
    }

    const percentage = Math.min(100, Math.round((countAboveThreshold / totalPokemon) * 100));
    setCompletionPercentage(percentage);

    if (percentage >= 100 && !currentRankingGenerated) {
      generateRankings(battleResults);
      setRankingGenerated(true);
      setCurrentRankingGenerated(true);

      toast({
        title: "Complete Ranking Achieved!",
        description: "You've completed enough battles to generate a full ranking of all Pokémon!",
      });
    }
  };

  const getBattlesRemaining = () => {
    const totalPokemon = allPokemon?.length || 0;
    if (totalPokemon <= 1) return 0;

    const threshold = Math.floor(totalPokemon * 0.3);
    const comparisonMap: Map<number, Set<number>> = new Map();

    for (const { winner, loser } of battleResults) {
      if (!comparisonMap.has(winner.id)) {
        comparisonMap.set(winner.id, new Set());
      }
      if (!comparisonMap.has(loser.id)) {
        comparisonMap.set(loser.id, new Set());
      }
      comparisonMap.get(winner.id)!.add(loser.id);
      comparisonMap.get(loser.id)!.add(winner.id);
    }

    let remaining = 0;
    for (const pokemon of allPokemon) {
      const comparedTo = comparisonMap.get(pokemon.id)?.size || 0;
      if (comparedTo < threshold) {
        remaining += threshold - comparedTo;
      }
    }

    return remaining;
  };

  return {
    setCompletionPercentage,
    calculateCompletionPercentage,
    getBattlesRemaining
  };
};
