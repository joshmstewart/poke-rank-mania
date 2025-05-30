import React, { useEffect } from "react";
import { usePokemonRanker } from "@/hooks/usePokemonRanker";
import { RankedPokemon } from "@/services/pokemon";
import { useRankingSuggestions } from "@/hooks/battle/useRankingSuggestions";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { Rating } from "ts-trueskill";
import { toast } from "@/hooks/use-toast";
import { PokemonRankerHeader } from "./pokemon/PokemonRankerHeader";
import { PokemonRankerContent } from "./pokemon/PokemonRankerContent";

const PokemonRanker = () => {
  console.log(`🔄 [MANUAL_MODE_SYNC] ===== PokemonRanker Component Render =====`);
  
  const {
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
    getPageRange,
    confidenceScores
  } = usePokemonRanker();

  const [showRankings, setShowRankings] = React.useState(false);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  // Get TrueSkill store functions
  const { clearAllRatings, getAllRatings, getRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();

  // SIMPLIFIED SYNC: Direct approach to load TrueSkill data when switching to Manual mode
  const syncWithTrueSkillStore = React.useCallback(async () => {
    console.log(`🔄 [MANUAL_SYNC_DIRECT] ===== STARTING SIMPLIFIED SYNC =====`);
    
    // Get all TrueSkill ratings
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔄 [MANUAL_SYNC_DIRECT] Found ${ratedPokemonIds.length} Pokemon with TrueSkill ratings`);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🔄 [MANUAL_SYNC_DIRECT] No TrueSkill ratings found - clearing Manual mode lists`);
      setRankedPokemon([]);
      // Keep existing available Pokemon if any, otherwise load will handle it
      return;
    }

    // Get Pokemon data - try context first, then current Manual mode data
    let allAvailablePokemon = Array.from(pokemonLookupMap.values());
    
    if (allAvailablePokemon.length === 0) {
      // Fallback: use current Manual mode Pokemon data
      const currentPokemon = [...availablePokemon, ...rankedPokemon];
      const pokemonMap = new Map();
      currentPokemon.forEach(pokemon => pokemonMap.set(pokemon.id, pokemon));
      allAvailablePokemon = Array.from(pokemonMap.values());
      console.log(`🔄 [MANUAL_SYNC_DIRECT] Using Manual mode fallback: ${allAvailablePokemon.length} Pokemon`);
    } else {
      console.log(`🔄 [MANUAL_SYNC_DIRECT] Using context data: ${allAvailablePokemon.length} Pokemon`);
    }

    if (allAvailablePokemon.length === 0) {
      console.log(`🔄 [MANUAL_SYNC_DIRECT] No Pokemon data available - sync will retry when data loads`);
      return;
    }

    // Separate Pokemon into rated and unrated
    const convertedRankings: RankedPokemon[] = [];
    const unratedPokemon: RankedPokemon[] = [];

    allAvailablePokemon.forEach(pokemon => {
      if (ratedPokemonIds.includes(pokemon.id)) {
        const trueskillRating = getRating(pokemon.id);
        const trueskillData = allRatings[pokemon.id];
        
        // Calculate conservative score and confidence
        const conservativeEstimate = trueskillRating.mu - 3 * trueskillRating.sigma;
        const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (trueskillRating.sigma / 8.33))));

        const rankedPokemon: RankedPokemon = {
          ...pokemon,
          score: conservativeEstimate,
          count: trueskillData.battleCount || 0,
          confidence: normalizedConfidence,
          wins: 0, // Manual mode doesn't track individual wins/losses
          losses: 0,
          winRate: 0,
          rating: trueskillRating
        };

        convertedRankings.push(rankedPokemon);
        console.log(`🔄 [MANUAL_SYNC_DIRECT] ✅ ${pokemon.name}: score=${conservativeEstimate.toFixed(2)}, confidence=${normalizedConfidence.toFixed(1)}%`);
      } else {
        const unratedRanked: RankedPokemon = {
          ...pokemon,
          score: 0,
          count: 0,
          confidence: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };
        unratedPokemon.push(unratedRanked);
      }
    });

    // Sort ranked Pokemon by score descending
    convertedRankings.sort((a, b) => b.score - a.score);

    console.log(`🔄 [MANUAL_SYNC_DIRECT] ✅ Final result: ${convertedRankings.length} ranked, ${unratedPokemon.length} unrated`);
    
    // Update Manual mode state
    setRankedPokemon(convertedRankings);
    setAvailablePokemon(unratedPokemon);
  }, [getAllRatings, getRating, pokemonLookupMap, availablePokemon, rankedPokemon, setRankedPokemon, setAvailablePokemon]);

  // CRITICAL: Sync when component mounts (user switches to Manual mode)
  useEffect(() => {
    console.log(`🔄 [MANUAL_SYNC_DIRECT] Component mounted - checking for TrueSkill data`);
    const ratings = getAllRatings();
    if (Object.keys(ratings).length > 0) {
      console.log(`🔄 [MANUAL_SYNC_DIRECT] Found ${Object.keys(ratings).length} ratings on mount - syncing immediately`);
      syncWithTrueSkillStore();
    } else {
      console.log(`🔄 [MANUAL_SYNC_DIRECT] No ratings found on mount`);
    }
  }, []); // Only run on mount

  // CRITICAL: Sync when TrueSkill store updates (Battle mode completed)
  useEffect(() => {
    const handleTrueSkillUpdate = (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_SYNC_DIRECT] TrueSkill store updated - event: ${event.type}`);
      // Small delay to ensure store is fully updated
      setTimeout(() => {
        syncWithTrueSkillStore();
      }, 100);
    };

    const handleTrueSkillCleared = () => {
      console.log(`🔄 [MANUAL_SYNC_DIRECT] TrueSkill store cleared - resetting Manual mode`);
      setRankedPokemon([]);
      // Don't clear available Pokemon - let normal loading handle this
    };

    // Listen for TrueSkill events
    document.addEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-cleared', handleTrueSkillCleared);

    return () => {
      document.removeEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-cleared', handleTrueSkillCleared);
    };
  }, [syncWithTrueSkillStore]);

  // Convert rankedPokemon to ensure proper RankedPokemon type
  const typedRankedPokemon: RankedPokemon[] = rankedPokemon.map(pokemon => {
    // Check if pokemon already has RankedPokemon properties
    if ('score' in pokemon && 'count' in pokemon) {
      return pokemon as RankedPokemon;
    } else {
      return {
        ...pokemon,
        score: 0,
        count: 0,
        confidence: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      } as RankedPokemon;
    }
  });

  // Initialize the ranking suggestions hook
  const {
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions
  } = useRankingSuggestions(typedRankedPokemon, setRankedPokemon as any);

  const handleReset = () => {
    console.log("🔄 [MANUAL_RESET_ENHANCED] Starting complete reset of Manual Mode");
    
    // Clear suggestion arrows explicitly on reset
    localStorage.removeItem('pokemon-active-suggestions');
    console.log("✅ [MANUAL_RESET_ENHANCED] Cleared pokemon-active-suggestions from localStorage");
    
    // Clear centralized TrueSkill store
    clearAllRatings();
    console.log("✅ [MANUAL_RESET_ENHANCED] Cleared centralized TrueSkill store");
    
    // Reset rankings
    resetRankings();
    
    // Clear suggestions
    clearAllSuggestions();
    
    console.log("✅ [MANUAL_RESET_ENHANCED] Manual Mode rankings and suggestions fully reset");
    
    toast({
      title: "Rankings Reset",
      description: "All rankings and suggestions have been cleared.",
      duration: 3000
    });
    
    setResetDialogOpen(false);
  };

  const handleToggleRankings = () => {
    setShowRankings(!showRankings);
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <PokemonRankerHeader
          selectedGeneration={selectedGeneration}
          showRankings={showRankings}
          resetDialogOpen={resetDialogOpen}
          onGenerationChange={handleGenerationChange}
          onToggleRankings={handleToggleRankings}
          onResetDialogChange={setResetDialogOpen}
          onReset={handleReset}
        />

        <PokemonRankerContent
          showRankings={showRankings}
          isLoading={isLoading}
          availablePokemon={availablePokemon}
          rankedPokemon={rankedPokemon}
          typedRankedPokemon={typedRankedPokemon}
          confidenceScores={confidenceScores}
          selectedGeneration={selectedGeneration}
          loadingType={loadingType}
          currentPage={currentPage}
          totalPages={totalPages}
          loadSize={loadSize}
          loadingRef={loadingRef}
          setAvailablePokemon={setAvailablePokemon}
          setRankedPokemon={setRankedPokemon}
          handlePageChange={handlePageChange}
          getPageRange={getPageRange}
          suggestRanking={suggestRanking}
          removeSuggestion={removeSuggestion}
          clearAllSuggestions={clearAllSuggestions}
        />
      </div>
    </div>
  );
};

export default PokemonRanker;
