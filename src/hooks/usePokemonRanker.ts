
import { useState, useEffect } from "react";
import { 
  Pokemon, 
  saveRankings, 
  loadUnifiedSessionData,
  saveUnifiedSessionData,
  ITEMS_PER_PAGE,
  RankedPokemon // make sure this import exists
} from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { LoadingType, RankingState, RankingActions } from "./pokemon/types";
import { useDataLoader } from "./pokemon/useDataLoader";
import { useScrollObserver } from "./pokemon/useScrollObserver";
import { usePagination } from "./pokemon/usePagination";
import { useAutoSave } from "./pokemon/useAutoSave";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { Rating } from "ts-trueskill";

// Change to "export type" for proper type re-exporting with isolatedModules
export type { LoadingType } from "./pokemon/types";

export const usePokemonRanker = (): RankingState & RankingActions & { loadingRef: React.RefObject<HTMLDivElement>, confidenceScores: Record<number, number> } => {
  const [isLoading, setIsLoading] = useState(true);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [rankedPokemon, setRankedPokemon] = useState<Pokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<number, number>>({});
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadSize, setLoadSize] = useState(50);
  const [loadingType, setLoadingType] = useState<LoadingType>("infinite");
  
  // Get TrueSkill store functions
  const { getAllRatings, getRating } = useTrueSkillStore();
  
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
  
  // Effect to populate ranked Pokemon from TrueSkill store
  useEffect(() => {
    const updateRankingsFromTrueSkill = () => {
      console.log("[TRUESKILL_MANUAL] Updating Manual Mode rankings from TrueSkill store");
      
      const allRatings = getAllRatings();
      const ratedPokemonIds = Object.keys(allRatings).map(Number);
      
      console.log("[TRUESKILL_MANUAL] Found TrueSkill ratings for Pokemon IDs:", ratedPokemonIds);
      
      if (ratedPokemonIds.length === 0) {
        console.log("[TRUESKILL_MANUAL] No TrueSkill ratings found, keeping current state");
        return;
      }
      
      // Get all Pokemon (available + ranked) to work with
      const allCurrentPokemon = [...availablePokemon, ...rankedPokemon];
      
      // Separate Pokemon into rated and unrated
      const ratedPokemon: Pokemon[] = [];
      const unratedPokemon: Pokemon[] = [];
      
      allCurrentPokemon.forEach(pokemon => {
        if (ratedPokemonIds.includes(pokemon.id)) {
          // Add TrueSkill rating to the Pokemon object
          const rating = getRating(pokemon.id);
          const pokemonWithRating = {
            ...pokemon,
            rating: rating
          };
          ratedPokemon.push(pokemonWithRating);
        } else {
          unratedPokemon.push(pokemon);
        }
      });
      
      // Sort rated Pokemon by conservative score (mu - 3 * sigma)
      ratedPokemon.sort((a, b) => {
        const scoreA = a.rating ? (a.rating.mu - 3 * a.rating.sigma) : 0;
        const scoreB = b.rating ? (b.rating.mu - 3 * b.rating.sigma) : 0;
        return scoreB - scoreA; // Higher scores first
      });
      
      console.log("[TRUESKILL_MANUAL] Sorted rated Pokemon:", ratedPokemon.map(p => ({
        name: p.name,
        id: p.id,
        score: p.rating ? (p.rating.mu - 3 * p.rating.sigma).toFixed(2) : 'N/A'
      })));
      
      // Calculate confidence scores
      const newConfidenceScores: Record<number, number> = {};
      ratedPokemon.forEach(pokemon => {
        if (pokemon.rating) {
          newConfidenceScores[pokemon.id] = Math.max(0, Math.min(100, 100 * (1 - (pokemon.rating.sigma / 8.33))));
        }
      });
      
      // Update state
      setRankedPokemon(ratedPokemon);
      setAvailablePokemon(unratedPokemon);
      setConfidenceScores(newConfidenceScores);
      
      console.log("[TRUESKILL_MANUAL] Updated Manual Mode - Ranked:", ratedPokemon.length, "Available:", unratedPokemon.length);
    };
    
    // Only update if we have data loaded
    if (!isLoading && (availablePokemon.length > 0 || rankedPokemon.length > 0)) {
      updateRankingsFromTrueSkill();
    }
  }, [isLoading, getAllRatings, getRating]); // Remove availablePokemon and rankedPokemon from deps to avoid infinite loop

  useEffect(() => {
    loadData();
  }, [selectedGeneration, currentPage, loadSize]);

  const resetRankings = () => {
    const allPokemon = [...availablePokemon, ...rankedPokemon].sort((a, b) => a.id - b.id);
    setAvailablePokemon(allPokemon);
    setRankedPokemon([]);
    setConfidenceScores({}); // Reset confidence scores as well
    
    localStorage.removeItem(`pokemon-rankings-gen-${selectedGeneration}`);
    
    toast({
      title: "Rankings Reset",
      description: "Your rankings have been cleared."
    });
    
    const sessionData = loadUnifiedSessionData();
    if (sessionData.rankings) {
      delete sessionData.rankings[`gen-${selectedGeneration}`];
      saveUnifiedSessionData(sessionData);
    }
  };

  const handleGenerationChange = (value: string) => {
    const newGenId = Number(value);
    setSelectedGeneration(newGenId);
    setCurrentPage(1);
    setAvailablePokemon([]);
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
    confidenceScores, // ✅ Added to resolve your error
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
