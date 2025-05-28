
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
  
  const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  console.log(`🔄 [PROCESSOR_FIX] useBattleStateOrchestration processing states - Battle ${String(currentBattleCount)}:`, {
    isProcessingResult: actionsData.isProcessingResult,
    isProcessing: actionsData.isProcessing,
    isAnyProcessing,
    isTransitioning: stateManagerData.isTransitioning,
    timestamp: new Date().toISOString()
  });

  return {
    generateRankingsWrapper,
    isAnyProcessing
  };
};
