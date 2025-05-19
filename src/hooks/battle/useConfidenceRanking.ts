
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { RankedPokemon } from "./useRankings";

const DEFAULT_CONFIDENCE_THRESHOLD = 0.15;

export const useConfidenceRanking = () => {
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});

  const calculateConfidenceScores = (rankedPokemon: RankedPokemon[]) => {
    if (!rankedPokemon || rankedPokemon.length === 0) return;

    const uniquePokemonCount = rankedPokemon.length;
    const totalParticipations = rankedPokemon.reduce((sum, p) => sum + p.count, 0);
    const avgParticipations = totalParticipations / uniquePokemonCount || 1;

    const scores: Record<number, number> = {};
    rankedPokemon.forEach(p => {
      const confidence = p.count / avgParticipations;
      scores[p.id] = Math.min(1, confidence) * 100;
    });

    setConfidenceScores(scores);
    return scores;
  };

  const getConfidentRankedPokemon = (
    rankedPokemon: RankedPokemon[],
    threshold = DEFAULT_CONFIDENCE_THRESHOLD
  ) => {
    if (!rankedPokemon || rankedPokemon.length === 0) return [];
    
    const uniquePokemonCount = rankedPokemon.length;
    const totalParticipations = rankedPokemon.reduce((sum, p) => sum + p.count, 0);
    const avgParticipations = totalParticipations / uniquePokemonCount || 1;

    let minAppearances = 1;
    if (uniquePokemonCount > 100) minAppearances = 4;
    else if (uniquePokemonCount > 50) minAppearances = 3;
    else if (uniquePokemonCount > 20) minAppearances = 2;

    return rankedPokemon
      .filter(p => p.count >= minAppearances || (p.count / avgParticipations) >= threshold)
      .sort((a, b) => b.score - a.score);
  };

  const getOverallRankingProgress = () => {
    const values = Object.values(confidenceScores);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const resetConfidenceScores = () => {
    setConfidenceScores({});
  };

  return {
    confidenceScores,
    calculateConfidenceScores,
    getConfidentRankedPokemon,
    getOverallRankingProgress,
    resetConfidenceScores
  };
};
