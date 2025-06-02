
import { useState, useEffect } from "react";
import { RankedPokemon, TopNOption } from "@/services/pokemon";

export const useRankingState = () => {
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});
  const [activeTier, setActiveTier] = useState<TopNOption>(() => {
    const storedTier = localStorage.getItem("pokemon-active-tier");
    return storedTier ? (storedTier === "All" ? "All" : Number(storedTier) as TopNOption) : 25;
  });

  useEffect(() => {
    localStorage.setItem("pokemon-active-tier", activeTier.toString());
  }, [activeTier]);

  return {
    finalRankings,
    setFinalRankings,
    confidenceScores,
    setConfidenceScores,
    activeTier,
    setActiveTier
  };
};
