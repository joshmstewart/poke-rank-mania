
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
  // Use the extracted state hook
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

  // Use the handlers hook
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
    setRankedPokemon,
    setConfidenceScores
  });

  // Use TrueSkill integration hook
  const { isStoreLoading } = useTrueSkillIntegration({
    isLoading,
    storeLoading: false, // We'll get this from the hook
    availablePokemon,
    rankedPokemon,
    setRankedPokemon,
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
  
  // Auto-save functionality - now cloud-only
  useAutoSave(rankedPokemon, selectedGeneration);

  useEffect(() => {
    loadData();
  }, [selectedGeneration, currentPage, loadSize]);

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
