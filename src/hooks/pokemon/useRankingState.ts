
import { useState, useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { LoadingType } from "./types";

export const useRankingState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [availablePokemon, setAvailablePokemon] = useState<any[]>([]);
  const [rankedPokemon, setRankedPokemonState] = useState<RankedPokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadSize, setLoadSize] = useState(10);
  const [loadingType, setLoadingType] = useState<LoadingType>("pagination");

  // CRITICAL DEBUG: Add logging to track where rankedPokemon changes come from
  const setRankedPokemon = useCallback((rankings: RankedPokemon[] | ((prev: RankedPokemon[]) => RankedPokemon[])) => {
    console.log(`🔍🔍🔍 [POKEMON_RANKING_STATE_SETTER] ⚠️⚠️⚠️ setRankedPokemon called`);
    console.log(`🔍🔍🔍 [POKEMON_RANKING_STATE_SETTER] Call stack:`, new Error().stack?.split('\n').slice(1, 5).join(' | '));
    
    if (typeof rankings === 'function') {
      setRankedPokemonState(prev => {
        const newRankings = rankings(prev);
        console.log(`🔍🔍🔍 [POKEMON_RANKING_STATE_SETTER] Function update: ${prev.length} → ${newRankings.length}`);
        console.log(`🔍🔍🔍 [POKEMON_RANKING_STATE_SETTER] ⚠️⚠️⚠️ RANKED POKEMON SET TO ${newRankings.length} POKEMON`);
        return newRankings;
      });
    } else {
      console.log(`🔍🔍🔍 [POKEMON_RANKING_STATE_SETTER] Direct update: setting to ${rankings.length} rankings`);
      console.log(`🔍🔍🔍 [POKEMON_RANKING_STATE_SETTER] ⚠️⚠️⚠️ RANKED POKEMON SET TO ${rankings.length} POKEMON`);
      setRankedPokemonState(rankings);
    }
  }, []);

  console.log(`🔍🔍🔍 [RANKING_STATE] ⚠️⚠️⚠️ rankedPokemon: ${rankedPokemon.length}`);

  return {
    isLoading,
    availablePokemon,
    rankedPokemon,
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
