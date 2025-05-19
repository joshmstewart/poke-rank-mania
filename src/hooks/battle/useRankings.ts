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

    // Explicitly filter to Pokémon that participated in at least one battle
    const participatingPokemonIds = new Set([...scoreMap.keys(), ...countMap.keys()]);

    const scoresWithPokemon: RankedPokemon[] = allPokemon
      .filter(p => participatingPokemonIds.has(p.id))
      .map(p => ({
        ...p,
        score: scoreMap.get(p.id) || 0,
        count: countMap.get(p.id) || 0
      }));

    console.log("🏁 Ranked Pokémon generated:", scoresWithPokemon.length);

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
