
import { useEffect } from "react";
import { useDataLoader } from "./pokemon/useDataLoader";
import { useScrollObserver } from "./pokemon/useScrollObserver";
import { usePagination } from "./pokemon/usePagination";
import { useAutoSave } from "./pokemon/useAutoSave";
import { useRankingState } from "./pokemon/useRankingState";
import { useRankingHandlers } from "./pokemon/useRankingHandlers";
import { useTrueSkillIntegration } from "./pokemon/useTrueSkillIntegration";
import { LoadingType, RankingState, RankingActions } from "./pokemon/types";

// Change to "export type" for proper type re-exporting with isolatedModules
export type { LoadingType } from "./pokemon/types";

export const usePokemonRanker = (): RankingState & RankingActions & { loadingRef: React.RefObject<HTMLDivElement>, confidenceScores: Record<number, number> } => {
  // CRITICAL FIX: Always call hooks in the same order
  const {
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
  } = useRankingState();

  // CRITICAL FIX: Always call all hooks unconditionally
  const {
    resetRankings,
    handleGenerationChange,
    handlePageChange,
    handleLoadingTypeChange,
    handleLoadSizeChange
  } = useRankingHandlers({
    setSelectedGeneration,
    setCurrentPage,
    setAvailablePokemon,
    setLoadingType,
    setLoadSize,
    availablePokemon,
    rankedPokemon,
    setRankedPokemon: setRankedPokemon as any,
    setConfidenceScores
  });

  const { isStoreLoading } = useTrueSkillIntegration({
    isLoading,
    storeLoading: false,
    availablePokemon,
    rankedPokemon,
    setRankedPokemon: setRankedPokemon as any,
    setAvailablePokemon,
    setConfidenceScores
  });
  
  const { loadData } = useDataLoader(
    selectedGeneration,
    currentPage,
    loadSize,
    loadingType,
    setAvailablePokemon,
    setRankedPokemon,
    setTotalPages,
    setIsLoading
  );
  
  const { loadingRef } = useScrollObserver(
    loadingType,
    isLoading,
    currentPage,
    totalPages,
    setCurrentPage
  );
  
  const { getPageRange } = usePagination(currentPage, totalPages);
  
  // CRITICAL FIX: Call useAutoSave unconditionally
  useAutoSave(rankedPokemon, selectedGeneration);

  // CRITICAL FIX: Move effect after all hooks
  useEffect(() => {
    loadData();
  }, [selectedGeneration, currentPage, loadSize]);

  console.log(`🔍🔍🔍 [POKEMON_RANKER_RETURN] Returning availablePokemon: ${availablePokemon.length}`);
  console.log(`🔍🔍🔍 [POKEMON_RANKER_RETURN] Returning rankedPokemon: ${rankedPokemon.length}`);

  return {
    isLoading: isLoading || isStoreLoading,
    availablePokemon,
    rankedPokemon,
    confidenceScores,
    selectedGeneration,
    currentPage,
    totalPages,
    loadSize,
    loadingType,
    loadingRef,
    setAvailablePokemon,
    setRankedPokemon,
    resetRankings,
    handleGenerationChange,
    handlePageChange,
    handleLoadingTypeChange,
    handleLoadSizeChange,
    getPageRange
  };
};
