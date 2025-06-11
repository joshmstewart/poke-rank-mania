
import { useState, useEffect, useRef, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { useRankingState } from "@/hooks/pokemon/useRankingState";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { useGenerationFilter } from "@/hooks/battle/useGenerationFilter";
import { usePagination } from "@/hooks/usePagination";
import { LoadingType } from "@/hooks/pokemon/types";
import { usePokemonContext } from "@/contexts/PokemonContext";

export const usePokemonRanker = () => {
  // CRITICAL FIX: Get Pokemon data from context here instead of in usePokemonData
  const { allPokemon: contextPokemon } = usePokemonContext();
  
  const {
    rankedPokemonState: rankedPokemon,
    setRankedPokemon,
    confidenceScores,
    setConfidenceScores,
    selectedGeneration,
    setSelectedGeneration,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    loadSize,
    setLoadSize,
    loadingType,
    setLoadingType
  } = useRankingState();

  const { filteredAvailablePokemon, setSelectedGeneration: setGen } = useGenerationFilter(
    contextPokemon, // Use context Pokemon directly
    selectedGeneration
  );

  const { paginatedItems: availablePokemon, totalPages: calculatedTotalPages } = usePagination(
    filteredAvailablePokemon,
    currentPage,
    filteredAvailablePokemon.length,
    "single"
  );

  useEffect(() => {
    if (calculatedTotalPages !== totalPages) {
      setTotalPages(calculatedTotalPages);
    }
  }, [calculatedTotalPages, totalPages, setTotalPages]);

  const loadingRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageRange = () => {
    const totalPagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);
    if (totalPages <= 5) {
      return totalPagesArray;
    }

    const currentPageIndex = currentPage - 1;
    let start = Math.max(0, currentPageIndex - 2);
    let end = Math.min(totalPages - 1, currentPageIndex + 2);

    if (start === 0) {
      end = Math.min(totalPages - 1, 4);
    } else if (end === totalPages - 1) {
      start = Math.max(0, totalPages - 5);
    }

    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i + 1);

    if (range[0] !== 1) {
      range.unshift(1);
      if (range[1] !== 2) {
        range.splice(1, 0, -1);
      }
    }

    if (range[range.length - 1] !== totalPages) {
      range.push(totalPages);
      if (range[range.length - 2] !== totalPages - 1) {
        range.splice(range.length - 1, 0, -1);
      }
    }

    return range;
  };

  const resetRankings = useCallback(() => {
    setRankedPokemon([]);
    setConfidenceScores({});
  }, [setRankedPokemon, setConfidenceScores]);

  return {
    isLoading,
    availablePokemon,
    rankedPokemon,
    setAvailablePokemon: setRankedPokemon,
    setRankedPokemon,
    confidenceScores,
    setConfidenceScores,
    selectedGeneration,
    setSelectedGeneration: setGen,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    loadSize,
    setLoadSize,
    loadingType,
    setLoadingType,
    loadingRef,
    handlePageChange,
    getPageRange,
    resetRankings
  };
};
