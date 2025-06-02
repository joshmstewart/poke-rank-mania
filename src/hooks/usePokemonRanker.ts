
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

  // CRITICAL DEBUG: Add ultra-specific logging to track where rankedPokemon gets set
  console.log(`🚨🚨🚨 [POKEMON_RANKER_DEBUG] ===== usePokemonRanker HOOK STATE =====`);
  console.log(`🚨🚨🚨 [POKEMON_RANKER_DEBUG] rankedPokemon from useRankingState: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [POKEMON_RANKER_DEBUG] availablePokemonFromLoader: ${availablePokemonFromLoader.length}`);
  console.log(`🚨🚨🚨 [POKEMON_RANKER_DEBUG] hasInitialized: ${hasInitialized}`);
  
  if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [POKEMON_RANKER_CRITICAL] RANKED POKEMON DETECTED: ${rankedPokemon.length}`);
    console.log(`🚨🚨🚨 [POKEMON_RANKER_CRITICAL] First 5 IDs: ${rankedPokemon.slice(0, 5).map(p => p.id).join(', ')}`);
    console.log(`🚨🚨🚨 [POKEMON_RANKER_CRITICAL] Call stack:`, new Error().stack?.split('\n').slice(1, 5).join(' | '));
  }

  const { filteredAvailablePokemon, setSelectedGeneration: setGen } = useGenerationFilter(
    availablePokemonFromLoader,
    selectedGeneration
  );

  const { paginatedItems: availablePokemon, totalPages: calculatedTotalPages } = usePagination(
    filteredAvailablePokemon,
    currentPage,
    loadSize,
    loadingType
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
    console.log(`🚨🚨🚨 [POKEMON_RANKER_RESET] Reset called - clearing rankedPokemon`);
    setRankedPokemon([]);
    setConfidenceScores({});
  }, [setRankedPokemon, setConfidenceScores]);

  // CRITICAL DEBUG: Monitor any effects that might be setting rankedPokemon
  useEffect(() => {
    console.log(`🚨🚨🚨 [POKEMON_RANKER_EFFECT_MONITOR] Effect triggered`);
    console.log(`🚨🚨🚨 [POKEMON_RANKER_EFFECT_MONITOR] rankedPokemon: ${rankedPokemon.length}`);
    console.log(`🚨🚨🚨 [POKEMON_RANKER_EFFECT_MONITOR] availablePokemonFromLoader: ${availablePokemonFromLoader.length}`);
  }, [rankedPokemon.length, availablePokemonFromLoader.length]);

  console.log(`🔍🔍🔍 [POKEMON_RANKER_RETURN] Returning availablePokemon: ${availablePokemon.length}`);
  console.log(`🔍🔍🔍 [POKEMON_RANKER_RETURN] Returning rankedPokemon: ${rankedPokemon.length}`);

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
