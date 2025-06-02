
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

  const setRankedPokemon = useCallback((rankings: RankedPokemon[] | ((prev: RankedPokemon[]) => RankedPokemon[])) => {
    if (typeof rankings === 'function') {
      setRankedPokemonState(rankings);
    } else {
      setRankedPokemonState(rankings);
    }
  }, []);

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
