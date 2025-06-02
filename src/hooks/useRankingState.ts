
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

  // CRITICAL DEBUG: Add logging to track where finalRankings changes come from
  const setFinalRankingsWithLogging = (rankings: RankedPokemon[] | ((prev: RankedPokemon[]) => RankedPokemon[])) => {
    console.log(`🔍🔍🔍 [RANKING_STATE_SETTER] ⚠️⚠️⚠️ setFinalRankings called`);
    console.log(`🔍🔍🔍 [RANKING_STATE_SETTER] Call stack:`, new Error().stack?.split('\n').slice(1, 5).join(' | '));
    
    if (typeof rankings === 'function') {
      setFinalRankings(prev => {
        const newRankings = rankings(prev);
        console.log(`🔍🔍🔍 [RANKING_STATE_SETTER] Function update: ${prev.length} → ${newRankings.length}`);
        console.log(`🔍🔍🔍 [RANKING_STATE_SETTER] ⚠️⚠️⚠️ FINAL RANKINGS SET TO ${newRankings.length} POKEMON`);
        return newRankings;
      });
    } else {
      console.log(`🔍🔍🔍 [RANKING_STATE_SETTER] Direct update: setting to ${rankings.length} rankings`);
      console.log(`🔍🔍🔍 [RANKING_STATE_SETTER] ⚠️⚠️⚠️ FINAL RANKINGS SET TO ${rankings.length} POKEMON`);
      setFinalRankings(rankings);
    }
  };

  console.log(`🔍🔍🔍 [RANKING_STATE] ⚠️⚠️⚠️ CURRENT finalRankings: ${finalRankings.length}`);

  return {
    finalRankings,
    setFinalRankings: setFinalRankingsWithLogging,
    confidenceScores,
    setConfidenceScores,
    activeTier,
    setActiveTier
  };
};
