import { useState, useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { LoadingType } from "./types";

export const useRankingState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [availablePokemon, setAvailablePokemon] = useState<any[]>([]);
  const [rankedPokemonState, setRankedPokemonState] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadSize, setLoadSize] = useState(10);
  const [loadingType, setLoadingType] = useState<LoadingType>("pagination");

  // CRITICAL DEBUG: Add ultra-detailed logging to track where rankedPokemon changes come from
  const setRankedPokemon = useCallback((rankings: RankedPokemon[] | ((prev: RankedPokemon[]) => RankedPokemon[])) => {
    console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] ===== setRankedPokemon CALLED =====`);
    console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] Function called with:`, typeof rankings === 'function' ? 'FUNCTION' : `ARRAY of ${rankings.length} Pokemon`);
    console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] Call stack:`, new Error().stack?.split('\n').slice(1, 8).join(' | '));
    
    if (typeof rankings === 'function') {
      setRankedPokemonState(prev => {
        const newRankings = rankings(prev);
        console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] Function update: ${prev.length} → ${newRankings.length}`);
        if (newRankings.length > 0) {
          console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] ⚠️⚠️⚠️ NON-EMPTY RANKINGS SET!`);
          console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] First 5 IDs: ${newRankings.slice(0, 5).map(p => p.id).join(', ')}`);
        }
        return newRankings;
      });
    } else {
      console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] Direct update: setting to ${rankings.length} rankings`);
      if (rankings.length > 0) {
        console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] ⚠️⚠️⚠️ NON-EMPTY RANKINGS SET!`);
        console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] First 5 IDs: ${rankings.slice(0, 5).map(p => p.id).join(', ')}`);
        console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] Sample Pokemon names: ${rankings.slice(0, 5).map(p => p.name).join(', ')}`);
      }
      setRankedPokemonState(rankings);
    }
    
    console.log(`🚨🚨🚨 [RANKING_STATE_SETTER_ULTRA_DEBUG] ===== setRankedPokemon COMPLETE =====`);
  }, []);

  console.log(`🚨🚨🚨 [RANKING_STATE_CURRENT] ⚠️⚠️⚠️ rankedPokemon current state: ${rankedPokemonState.length}`);
  if (rankedPokemonState.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_STATE_CURRENT] ⚠️⚠️⚠️ CURRENT NON-EMPTY STATE DETECTED!`);
    console.log(`🚨🚨🚨 [RANKING_STATE_CURRENT] Current Pokemon IDs: ${rankedPokemonState.slice(0, 10).map(p => p.id).join(', ')}`);
  }

  return {
    isLoading,
    availablePokemon,
    rankedPokemonState,
    confidenceScores,
    selectedGeneration,
    currentPage,
    totalPages,
    loadSize,
    loadingType,
    setIsLoading,
    setAvailablePokemon,
    setRankedPokemon,
    setConfidenceScores,
    setSelectedGeneration,
    setCurrentPage,
    setTotalPages,
    setLoadSize,
    setLoadingType
  };
};
