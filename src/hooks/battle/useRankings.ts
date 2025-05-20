
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";
import { Rating } from "ts-trueskill";

export interface RankedPokemon extends Pokemon {
  score: number;      // Will be used for the conservative TrueSkill estimate (μ - 3σ)
  count: number;      // Number of battles the Pokémon has participated in
  confidence: number; // Will be derived from sigma (lower sigma = higher confidence)
}

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});

  // Generate rankings based on TrueSkill ratings
  const generateRankings = (results: SingleBattle[]): RankedPokemon[] => {
    // Create a map to track battle counts
    const countMap = new Map<number, number>();
    
    // Count battles for each Pokémon
    results.forEach(result => {
      countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
      countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
    });

    // Get a set of all Pokémon IDs that participated in battles
    const participatingPokemonIds = new Set([...countMap.keys()]);

    // Create ranked list with TrueSkill scores
    const rankedPokemon: RankedPokemon[] = allPokemon
      .filter(p => participatingPokemonIds.has(p.id))
      .map(p => {
        // Create or access the rating
        if (!p.rating) {
          p.rating = new Rating(); // Default μ=25, σ≈8.33
        } else if (!(p.rating instanceof Rating)) {
          // Convert from stored format if needed
          p.rating = new Rating(p.rating.mu, p.rating.sigma);
        }

        // Calculate conservative TrueSkill estimate (μ - 3σ)
        const conservativeEstimate = p.rating.mu - 3 * p.rating.sigma;
        
        // Convert uncertainty (σ) to a confidence percentage (0-100)
        // Lower sigma means higher confidence
        const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (p.rating.sigma / 8.33))));

        return {
          ...p,
          score: conservativeEstimate,
          count: countMap.get(p.id) || 0,
          confidence: normalizedConfidence
        };
      })
      // Sort by the conservative TrueSkill estimate (higher is better)
      .sort((a, b) => b.score - a.score);

    setFinalRankings(rankedPokemon);

    // Create confidence map for easy lookup
    const confidenceMap: Record<number, number> = {};
    rankedPokemon.forEach(p => {
      confidenceMap[p.id] = p.confidence;
    });
    setConfidenceScores(confidenceMap);

    return rankedPokemon;
  };

  const handleSaveRankings = () => {
    console.log("[useRankings] Rankings saved.", finalRankings);
  };

  return {
    finalRankings,
    confidenceScores,
    generateRankings,
    handleSaveRankings
  };
};
