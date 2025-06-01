
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

  // 🚨🚨🚨 ULTRA CRITICAL MISSING DATA SOURCE DETECTION
  console.log(`🔍🔍🔍 [POKEMON_RANKER_HOOK] ===== CRITICAL DATA SOURCE HUNT =====`);
  console.log(`🔍🔍🔍 [POKEMON_RANKER_STATE] Raw availablePokemon: ${availablePokemon.length}`);
  console.log(`🔍🔍🔍 [POKEMON_RANKER_STATE] Raw rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🔍🔍🔍 [POKEMON_RANKER_STATE] selectedGeneration: ${selectedGeneration}`);
  console.log(`🔍🔍🔍 [POKEMON_RANKER_STATE] loadSize: ${loadSize}`);
  console.log(`🔍🔍🔍 [POKEMON_RANKER_STATE] currentPage: ${currentPage}`);
  console.log(`🔍🔍🔍 [POKEMON_RANKER_STATE] totalPages: ${totalPages}`);
  
  // 🚨 CRITICAL: Check if rankedPokemon state has data that TrueSkill doesn't know about
  if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [CRITICAL_FINDING] RANKED POKEMON FOUND IN STATE: ${rankedPokemon.length}`);
    console.log(`🚨🚨🚨 [CRITICAL_FINDING] Ranked Pokemon IDs: ${rankedPokemon.slice(0, 20).map(p => p.id).join(', ')}${rankedPokemon.length > 20 ? '...' : ''}`);
    console.log(`🚨🚨🚨 [CRITICAL_FINDING] Sample names: ${rankedPokemon.slice(0, 5).map(p => p.name).join(', ')}`);
    console.log(`🚨🚨🚨 [CRITICAL_FINDING] WHERE DID THIS DATA COME FROM???`);
  }

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
    storeLoading: false,
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

  // CRITICAL: Log what we're returning
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
