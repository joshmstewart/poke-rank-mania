
import { useMemo, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStateOrchestration = (
  stateManagerData: any,
  providersData: any,
  actionsData: any,
  enhancedStartNewBattle: (battleType: BattleType) => Pokemon[] | undefined
) => {
  // Create generateRankings wrapper that returns array
  const generateRankingsWrapper = useCallback((results: any[]) => {
    const rankings = providersData.generateRankings(results);
    // If generateRankings returns void, return empty array or finalRankings
    return rankings || providersData.finalRankings || [];
  }, [providersData.generateRankings, providersData.finalRankings]);

  const isAnyProcessing = actionsData.isProcessingResult;

  return {
    generateRankingsWrapper,
    isAnyProcessing
  };
};
