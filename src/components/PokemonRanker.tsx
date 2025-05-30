
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

  // CRITICAL FIX: Simplified and more reliable sync with TrueSkill store
  const syncWithTrueSkillStore = React.useCallback(() => {
    console.log(`🔄 [MANUAL_SYNC_FIXED] ===== SYNCING MANUAL MODE WITH TRUESKILL STORE =====`);
    
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔄 [MANUAL_SYNC_FIXED] Found ${ratedPokemonIds.length} Pokemon with TrueSkill ratings`);
    
    // Get all available Pokemon from context
    const allAvailablePokemon = Array.from(pokemonLookupMap.values());
    
    if (allAvailablePokemon.length === 0) {
      console.log(`🔄 [MANUAL_SYNC_FIXED] No Pokemon data available from context yet`);
      return;
    }
    
    console.log(`🔄 [MANUAL_SYNC_FIXED] Processing ${allAvailablePokemon.length} Pokemon from context`);
    
    // If no ratings exist, show all Pokemon as unrated
    if (ratedPokemonIds.length === 0) {
      console.log(`🔄 [MANUAL_SYNC_FIXED] No TrueSkill ratings found - showing all Pokemon as unrated`);
      
      const unratedPokemon: RankedPokemon[] = allAvailablePokemon.map(pokemon => ({
        ...pokemon,
        score: 0,
        count: 0,
        confidence: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      }));
      
      setRankedPokemon([]);
      setAvailablePokemon(unratedPokemon);
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
          wins: 0,
          losses: 0,
          winRate: 0,
          rating: trueskillRating
        };

        convertedRankings.push(rankedPokemon);
        
        console.log(`🔄 [MANUAL_SYNC_FIXED] Added ${pokemon.name} with score ${conservativeEstimate.toFixed(2)}`);
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

    console.log(`🔄 [MANUAL_SYNC_FIXED] ✅ Final result: ${convertedRankings.length} ranked, ${unratedPokemon.length} unrated`);
    
    // Update Manual mode with separated Pokemon
    setRankedPokemon(convertedRankings);
    setAvailablePokemon(unratedPokemon);
  }, [getAllRatings, getRating, pokemonLookupMap, setRankedPokemon, setAvailablePokemon]);

  // CRITICAL FIX: Sync on mount and when Pokemon context is available
  useEffect(() => {
    if (pokemonLookupMap.size > 0) {
      console.log(`🔄 [MANUAL_SYNC_FIXED] Pokemon context available, syncing...`);
      syncWithTrueSkillStore();
    }
  }, [pokemonLookupMap.size, syncWithTrueSkillStore]);

  // CRITICAL FIX: Listen for TrueSkill store updates
  useEffect(() => {
    const handleTrueSkillUpdate = (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_SYNC_FIXED] TrueSkill store updated:`, event.type);
      // Small delay to ensure store is fully updated
      setTimeout(() => {
        syncWithTrueSkillStore();
      }, 50);
    };

    const handleTrueSkillCleared = () => {
      console.log(`🔄 [MANUAL_SYNC_FIXED] TrueSkill store CLEARED, resetting Manual mode`);
      syncWithTrueSkillStore();
    };

    // Listen for all relevant TrueSkill events
    document.addEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-cleared', handleTrueSkillCleared);
    document.addEventListener('manual-mode-reset', handleTrueSkillCleared);
    document.addEventListener('battle-system-reset', handleTrueSkillCleared);

    return () => {
      document.removeEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-cleared', handleTrueSkillCleared);
      document.removeEventListener('manual-mode-reset', handleTrueSkillCleared);
      document.removeEventListener('battle-system-reset', handleTrueSkillCleared);
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
