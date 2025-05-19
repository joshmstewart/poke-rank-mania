import { useState, useEffect } from "react";
import { SingleBattle } from "./types";
import { RankedPokemon } from "./useRankings";
import { toast } from "@/hooks/use-toast";

export const useCompletionTracker = (
  rankedPokemon: RankedPokemon[],
  battleResults: SingleBattle[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  generateRankings: (results: SingleBattle[]) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>
) => {
  const [currentRankingGenerated, setCurrentRankingGenerated] = useState(false);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});

  useEffect(() => {
    calculateCompletionPercentage();
  }, [battleResults?.length]);

  const calculateCompletionPercentage = () => {
    if (!rankedPokemon || rankedPokemon.length <= 1) {
      setCompletionPercentage(100);
      return;
    }

    const log2N = Math.log2(rankedPokemon.length);

    const confidences = rankedPokemon.map(p => {
      return Math.min(1, p.count / log2N);
    });

    const confidenceMap: Record<number, number> = {};
    rankedPokemon.forEach((p, i) => {
      confidenceMap[p.id] = Math.round(confidences[i] * 100);
    });

    setConfidenceScores(confidenceMap);

    const averageConfidence = confidences.reduce((a, b) => a + b, 0) / rankedPokemon.length;
    const percent = Math.round(averageConfidence * 100);
    setCompletionPercentage(percent);

    if (percent >= 100 && !currentRankingGenerated && battleResults.length >= 25) {
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
    const log2N = Math.log2(rankedPokemon.length);
    const idealComparisons = Math.ceil(rankedPokemon.length * log2N);
    return Math.max(0, idealComparisons - battleResults.length);
  };

  const getConfidentRankedPokemon = (threshold = 0.8) => {
    const minAppearances = Math.max(3, Math.ceil(battleResults.length / 10));

    const confident = rankedPokemon
      .filter(p => {
        const confidence = p.count / Math.log2(rankedPokemon.length);
        return confidence >= threshold && p.count >= minAppearances;
      })
      .sort((a, b) => b.score - a.score);

    console.log(`👀 Confident Pokémon: ${confident.length} / ${rankedPokemon.length}`);
    return confident;
  };

  const getOverallRankingProgress = () => {
    const confidences = rankedPokemon.map(p => {
      return Math.min(1, p.count / Math.log2(rankedPokemon.length));
    });
    return Math.round((confidences.reduce((a, b) => a + b, 0) / rankedPokemon.length) * 100);
  };

  return {
    setCompletionPercentage,
    calculateCompletionPercentage,
    getBattlesRemaining,
    getConfidentRankedPokemon,
    getOverallRankingProgress,
    confidenceScores
  };
};
