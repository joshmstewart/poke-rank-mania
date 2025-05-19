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
      console.log("Result winner ID:", result.winner.id, "loser ID:", result.loser.id);
      scoreMap.set(result.winner.id, (scoreMap.get(result.winner.id) || 0) + 1);
      scoreMap.set(result.loser.id, scoreMap.get(result.loser.id) || 0);
      countMap.set(result.winner.id, (countMap.get(result.winner.id) || 0) + 1);
      countMap.set(result.loser.id, (countMap.get(result.loser.id) || 0) + 1);
    });

    // Verify contents of scoreMap
    console.log("✅ scoreMap entries:", Array.from(scoreMap.entries()));

    const participatingPokemonIds = new Set([...scoreMap.keys(), ...countMap.keys()]);

    // Log a sample of allPokemon IDs for cross-reference
    console.log("📚 Sample allPokemon IDs:", allPokemon.slice(0, 10).map(p => p.id));

    const scoresWithPokemon: RankedPokemon[] = allPokemon
      .filter(p => participatingPokemonIds.has(p.id))
      .map(p => ({
        ...p,
        score: scoreMap.get(p.id) || 0,
        count: countMap.get(p.id) || 0
      }));

    console.log("🏁 Ranked Pokémon generated:", scoresWithPokemon.length);
    console.log("🎯 Final ranking sample:", scoresWithPokemon.slice(0, 5));

    scoresWithPokemon.sort((a, b) => b.score - a.score);
    setFinalRankings(scoresWithPokemon);

    const log2N = Math.log2(scoresWithPokemon.length || 1);
    const confidenceMap: Record<number, number> = {};
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
