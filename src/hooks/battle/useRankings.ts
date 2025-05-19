import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { SingleBattle } from "./types";

export interface RankedPokemon extends Pokemon {
  score: number;
  count: number;
}

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});

  const generateRankings = (results: SingleBattle[]) => {
    console.log("🧠 generateRankings called with", results.length, "battles");

    const scoreMap = new Map<number, number>();
    const countMap = new Map<number, number>();

    results.forEach(result => {
      scoreMap.set(result.winner.id, (scoreMap.get(result.winner.id) || 0) + 1);
      scoreMap.set(result.loser.id, scoreMap.get(result.loser.id) || 0);
      countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
      countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
    });

    // Set a dynamic minimum appearance threshold based on battles completed
    const totalBattles = results.length;
    const minAppearances = Math.max(1, Math.floor(Math.log2(allPokemon.length)));

    const scoresWithPokemon: RankedPokemon[] = allPokemon
      .map(p => ({
        ...p,
        score: scoreMap.get(p.id) || 0,
        count: countMap.get(p.id) || 0
      }))
      .filter(p => p.count >= minAppearances); // Only include Pokémon above threshold

    // Ensure sorting by highest score
    scoresWithPokemon.sort((a, b) => b.score - a.score || b.count - a.count);

    console.log("🏁 Ranked Pokémon generated:", scoresWithPokemon.length);
    setFinalRankings(scoresWithPokemon);

    // Compute confidence scores based on the appearance threshold
    const confidenceMap: Record<number, number> = {};
    const log2N = Math.log2(allPokemon.length || 1);
    scoresWithPokemon.forEach(p => {
      confidenceMap[p.id] = Math.round(Math.min(1, p.count / log2N) * 100);
    });

    setConfidenceScores(confidenceMap);
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
