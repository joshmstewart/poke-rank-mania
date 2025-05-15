import { useState, useEffect } from "react";
import { 
  Pokemon, 
  saveRankings, 
  loadUnifiedSessionData,
  saveUnifiedSessionData,
  ITEMS_PER_PAGE
} from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { LoadingType, RankingState, RankingActions } from "./pokemon/types";
import { useDataLoader } from "./pokemon/useDataLoader";
import { useScrollObserver } from "./pokemon/useScrollObserver";
import { usePagination } from "./pokemon/usePagination";
import { useAutoSave } from "./pokemon/useAutoSave";

// Change to "export type" for proper type re-exporting with isolatedModules
export type { LoadingType } from "./pokemon/types";

export const usePokemonRanker = (): RankingState & RankingActions & { loadingRef: React.RefObject<HTMLDivElement> } => {
  const [isLoading, setIsLoading] = useState(true);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [rankedPokemon, setRankedPokemon] = useState<Pokemon[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(0); // Default to All Generations
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadSize, setLoadSize] = useState(50); // Default to first option
  const [loadingType, setLoadingType] = useState<LoadingType>("pagination");
  
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
  
  // Auto-save functionality
  useAutoSave(rankedPokemon, selectedGeneration);
  
  // Load data on generation change or page change
  useEffect(() => {
    if (loadingType === "pagination" || loadingType === "single") {
      loadData();
    } else if (loadingType === "infinite" && availablePokemon.length === 0) {
      // Initialize infinite scroll with first page
      loadData();
    }
  }, [selectedGeneration, currentPage, loadSize, loadingType]);
  
  const resetRankings = () => {
    // Get all Pokemon back to available list
    const allPokemon = [...availablePokemon, ...rankedPokemon].sort((a, b) => a.id - b.id);
    setAvailablePokemon(allPokemon);
    setRankedPokemon([]);
    
    // Clear local storage for the current generation
    localStorage.removeItem(`pokemon-rankings-gen-${selectedGeneration}`);
    
    toast({
      title: "Rankings Reset",
      description: "Your rankings have been cleared."
    });
    
    // Also update the unified session data
    const sessionData = loadUnifiedSessionData();
    if (sessionData.rankings) {
      delete sessionData.rankings[`gen-${selectedGeneration}`];
      saveUnifiedSessionData(sessionData);
    }
  };

  const handleGenerationChange = (value: string) => {
    const newGenId = Number(value);
    setSelectedGeneration(newGenId);
    setCurrentPage(1); // Reset to page 1 when changing generations
    setAvailablePokemon([]); // Clear the list for infinite scrolling
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLoadingTypeChange = (value: string) => {
    setLoadingType(value as LoadingType);
    setCurrentPage(1);
    setAvailablePokemon([]);
  };

  const handleLoadSizeChange = (value: string) => {
    setLoadSize(Number(value));
    setCurrentPage(1);
    setAvailablePokemon([]);
  };

  return {
    isLoading,
    availablePokemon,
    rankedPokemon,
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
