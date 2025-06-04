
import { useState, useEffect, useRef, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { useRankingState } from "@/hooks/pokemon/useRankingState";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { useGenerationFilter } from "@/hooks/battle/useGenerationFilter";
import { usePagination } from "@/hooks/usePagination";
import { LoadingType } from "@/hooks/pokemon/types";

export const usePokemonRanker = () => {
  const { loadPokemon, allPokemon: availablePokemonFromLoader, isLoading } = usePokemonLoader();
  const [hasInitialized, setHasInitialized] = useState(false);
  
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

  // Initialize Pokemon loading
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      setLoadingType("single");
      setLoadSize(1000);
      loadPokemon(0, true);
    }
  }, [hasInitialized, loadPokemon, setLoadingType, setLoadSize]);

  // CRITICAL FIX: Add safety checks for availablePokemonFromLoader
  const safeAvailablePokemonFromLoader = Array.isArray(availablePokemonFromLoader) ? availablePokemonFromLoader : [];

  const { filteredAvailablePokemon, setSelectedGeneration: setGen } = useGenerationFilter(
    safeAvailablePokemonFromLoader,
    selectedGeneration
  );

  // CRITICAL FIX: Add safety checks for filteredAvailablePokemon
  const safeFilteredAvailablePokemon = Array.isArray(filteredAvailablePokemon) ? filteredAvailablePokemon : [];

  const { paginatedItems: availablePokemon, totalPages: calculatedTotalPages } = usePagination(
    safeFilteredAvailablePokemon,
    currentPage,
    safeFilteredAvailablePokemon.length,
    "single"
  );

  useEffect(() => {
    if (calculatedTotalPages !== totalPages) {
      setTotalPages(calculatedTotalPages);
    }
  }, [calculatedTotalPages, totalPages, setTotalPages]);

  const loadingRef = useRef<HTMLDivElement>(null);

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
    availablePokemon: Array.isArray(availablePokemon) ? availablePokemon : [],
    rankedPokemon: Array.isArray(rankedPokemon) ? rankedPokemon : [],
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
