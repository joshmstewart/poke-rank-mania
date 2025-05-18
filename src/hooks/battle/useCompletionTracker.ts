import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleResult } from "./types";
import { toast } from "@/hooks/use-toast";

export const useCompletionTracker = (
  allPokemon: Pokemon[],
  battleResults: BattleResult[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: BattleResult[]) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>
) => {
  const [currentRankingGenerated, setCurrentRankingGenerated] = useState(false);

  useEffect(() => {
    calculateCompletionPercentage();
  }, [battleResults?.length, allPokemon?.length]);

  const calculateCompletionPercentage = () => {
    const totalPokemon = allPokemon?.length || 0;
    const currentComparisons = battleResults?.length || 0;

    if (!totalPokemon || totalPokemon <= 1) {
      setCompletionPercentage(100);
      return;
    }

    // Diagnostic logging
    console.log(`[useCompletionTracker] totalPokemon: ${totalPokemon}`);
    console.log(`[useCompletionTracker] currentComparisons: ${currentComparisons}`);
    console.log(`[useCompletionTracker] first battleResult:`, battleResults[0]);

    // Build a map of which Pokémon have been directly compared
    const comparisonMap = new Map<number, Set<number>>();

    for (const result of battleResults) {
      const winnerId = result.winner.id;
      const loserId = result.loser.id;

      if (!comparisonMap.has(winnerId)) {
        comparisonMap.set(winnerId, new Set());
      }
      if (!comparisonMap.has(loserId)) {
        comparisonMap.set(loserId, new Set());
      }

      comparisonMap.get(winnerId)!.add(loserId);
      comparisonMap.get(loserId)!.add(winnerId);
    }

    const threshold = Math.ceil(Math.log2(totalPokemon));
    let countAboveThreshold = 0;

    for (const pokemon of allPokemon) {
      const comparedTo = comparisonMap.get(pokemon.id);
      const comparedCount = comparedTo?.size || 0;
      if (comparedCount >= threshold) {
        countAboveThreshold++;
      }

      console.log(
        `[useCompletionTracker] ${pokemon.name} (${pokemon.id}) has been compared to ${comparedCount} others`
      );
    }

    const percentage = Math.round((countAboveThreshold / totalPokemon) * 100);
    console.log(`[useCompletionTracker] ${countAboveThreshold}/${totalPokemon} pass threshold`);
    setCompletionPercentage(percentage);

    if (percentage >= 100 && !currentRankingGenerated) {
      console.log("[useCompletionTracker] 100% completion reached - generating final rankings");
      generateRankings(battleResults);
      setRankingGenerated(true);
      setCurrentRankingGenerated(true);

      toast({
        title: "Complete Ranking Achieved!",
        description: "You've completed enough battles to generate a full ranking of all Pokémon!",
        variant: "default"
      });
    }
  };

  const getBattlesRemaining = () => {
    const totalPokemon = allPokemon?.length || 0;
    const threshold = Math.ceil(Math.log2(totalPokemon));
    const comparisonMap = new Map<number, Set<number>>();

    for (const result of battleResults) {
      const winnerId = result.winner.id;
      const loserId = result.loser.id;

      if (!comparisonMap.has(winnerId)) comparisonMap.set(winnerId, new Set());
      if (!comparisonMap.has(loserId)) comparisonMap.set(loserId, new Set());

      comparisonMap.get(winnerId)!.add(loserId);
      comparisonMap.get(loserId)!.add(winnerId);
    }

    let remaining = 0;

    for (const pokemon of allPokemon) {
      const comparedTo = comparisonMap.get(pokemon.id);
      const comparedCount = comparedTo?.size || 0;
      if (comparedCount < threshold) {
        remaining += threshold - comparedCount;
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
