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
  }, [battleResults?.length]);

  const calculateCompletionPercentage = () => {
    if (!allPokemon || allPokemon.length <= 1) {
      setCompletionPercentage(100);
      return;
    }

    const comparisonCountById: Record<number, number> = {};

    battleResults.forEach(result => {
      comparisonCountById[result.winner.id] = (comparisonCountById[result.winner.id] || 0) + 1;
      comparisonCountById[result.loser.id] = (comparisonCountById[result.loser.id] || 0) + 1;
    });

    const log2N = Math.log2(allPokemon.length);
    const confidences = allPokemon.map(p => {
      const count = comparisonCountById[p.id] || 0;
      return Math.min(1, count / log2N);
    });

    const averageConfidence = confidences.reduce((a, b) => a + b, 0) / allPokemon.length;
    const percent = Math.round(averageConfidence * 100);
    setCompletionPercentage(percent);

    if (percent >= 100 && !currentRankingGenerated) {
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
    const total = allPokemon.length;
    const log2N = Math.log2(total);
    const idealComparisons = Math.ceil(total * log2N);
    const current = battleResults.length;
    return Math.max(0, idealComparisons - current);
  };

  const getConfidentRankedPokemon = (threshold = 0.8) => {
    const countById: Record<number, number> = {};
    battleResults.forEach(result => {
      countById[result.winner.id] = (countById[result.winner.id] || 0) + 1;
      countById[result.loser.id] = (countById[result.loser.id] || 0) + 1;
    });

    const log2N = Math.log2(allPokemon.length);
    return allPokemon.filter(p => {
      const count = countById[p.id] || 0;
      const confidence = count / log2N;
      return confidence >= threshold;
    });
  };

  const getOverallRankingProgress = () => {
    const countById: Record<number, number> = {};
    battleResults.forEach(result => {
      countById[result.winner.id] = (countById[result.winner.id] || 0) + 1;
      countById[result.loser.id] = (countById[result.loser.id] || 0) + 1;
    });

    const log2N = Math.log2(allPokemon.length);
    const confidences = allPokemon.map(p => {
      const count = countById[p.id] || 0;
      return Math.min(1, count / log2N);
    });

    return Math.round((confidences.reduce((a, b) => a + b, 0) / allPokemon.length) * 100);
  };

  return {
    setCompletionPercentage,
    calculateCompletionPercentage,
    getBattlesRemaining,
    getConfidentRankedPokemon,
    getOverallRankingProgress
  };
};
