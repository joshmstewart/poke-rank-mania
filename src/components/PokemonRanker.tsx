
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

  // CRITICAL FIX: Load ALL Pokemon with TrueSkill ratings, not just those in current view
  useEffect(() => {
    console.log(`🔄 [MANUAL_SYNC_FIX] ===== SYNCING MANUAL MODE WITH TRUESKILL STORE =====`);
    
    const syncWithTrueSkillStore = () => {
      const allRatings = getAllRatings();
      const ratedPokemonIds = Object.keys(allRatings).map(Number);
      
      console.log(`🔄 [MANUAL_SYNC_FIX] Found ${ratedPokemonIds.length} Pokemon with TrueSkill ratings`);
      
      if (ratedPokemonIds.length === 0) {
        console.log(`🔄 [MANUAL_SYNC_FIX] No TrueSkill ratings found - keeping current Manual rankings`);
        return;
      }

      // FIXED: Get ALL Pokemon from context map, not just those currently loaded
      const allAvailablePokemon = Array.from(pokemonLookupMap.values());
      console.log(`🔄 [MANUAL_SYNC_FIX] Total Pokemon in context: ${allAvailablePokemon.length}`);

      if (allAvailablePokemon.length === 0) {
        console.log(`🔄 [MANUAL_SYNC_FIX] No Pokemon in context map yet - waiting...`);
        return;
      }

      // Separate ALL Pokemon into rated and unrated (not just those in current view)
      const convertedRankings: RankedPokemon[] = [];
      const unratedPokemon: RankedPokemon[] = [];

      allAvailablePokemon.forEach(pokemon => {
        if (ratedPokemonIds.includes(pokemon.id)) {
          const trueskillRating = getRating(pokemon.id);
          const trueskillData = allRatings[pokemon.id];
          
          // Calculate conservative score and confidence (same as Battle mode)
          const conservativeEstimate = trueskillRating.mu - 3 * trueskillRating.sigma;
          const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (trueskillRating.sigma / 8.33))));

          // Create a proper RankedPokemon object with all required properties
          const rankedPokemon: RankedPokemon = {
            ...pokemon,
            score: conservativeEstimate,
            count: trueskillData.battleCount || 0,
            confidence: normalizedConfidence,
            wins: 0, // Manual mode doesn't track wins/losses separately
            losses: 0,
            winRate: 0,
            rating: trueskillRating
          };

          convertedRankings.push(rankedPokemon);
        } else {
          // Convert unrated Pokemon to RankedPokemon format with default values
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

      // Sort ranked Pokemon by score descending (highest first)
      convertedRankings.sort((a, b) => b.score - a.score);

      console.log(`🔄 [MANUAL_SYNC_FIX] ✅ Converted ${convertedRankings.length} ranked Pokemon, ${unratedPokemon.length} unrated`);
      console.log(`🔄 [MANUAL_SYNC_FIX] Top 5 ranked Pokemon:`, convertedRankings.slice(0, 5).map(p => `${p.name} (${p.score.toFixed(1)})`));
      
      // Update Manual mode with ALL Pokemon
      setRankedPokemon(convertedRankings);
      setAvailablePokemon(unratedPokemon);
      console.log(`🔄 [MANUAL_SYNC_FIX] ✅ Manual mode updated with ALL Pokemon data`);
    };

    // Only sync if we have Pokemon context data
    if (pokemonLookupMap.size > 0) {
      syncWithTrueSkillStore();
    } else {
      console.log(`🔄 [MANUAL_SYNC_FIX] Pokemon context not ready yet, waiting...`);
    }

    // Listen for TrueSkill store updates
    const handleTrueSkillUpdate = (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_SYNC_FIX] TrueSkill store updated, re-syncing Manual mode...`);
      if (pokemonLookupMap.size > 0) {
        syncWithTrueSkillStore();
      }
    };

    // Add event listeners
    document.addEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);

    // Cleanup
    return () => {
      document.removeEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);
    };
  }, [getAllRatings, getRating, pokemonLookupMap, setRankedPokemon, setAvailablePokemon]);

  // Convert rankedPokemon to ensure proper RankedPokemon type
  const typedRankedPokemon: RankedPokemon[] = rankedPokemon.map(pokemon => {
    // Check if pokemon already has RankedPokemon properties (from TrueSkill sync)
    const hasRankedProps = 'score' in pokemon && 'count' in pokemon;
    
    if (hasRankedProps) {
      // Pokemon is already a RankedPokemon, just cast it
      return pokemon as RankedPokemon;
    } else {
      // Pokemon needs to be converted to RankedPokemon with defaults
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
    console.log("🔄 [MANUAL_RESET] Starting complete reset of Manual Mode");
    
    // Clear suggestion arrows explicitly on reset
    localStorage.removeItem('pokemon-active-suggestions');
    console.log("✅ [MANUAL_RESET] Cleared pokemon-active-suggestions from localStorage");
    
    // Clear centralized TrueSkill store
    clearAllRatings();
    console.log("✅ [MANUAL_RESET] Cleared centralized TrueSkill store");
    
    // Reset rankings
    resetRankings();
    
    // Clear suggestions
    clearAllSuggestions();
    
    console.log("✅ [MANUAL_RESET] Manual Mode rankings and suggestions fully reset");
    
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
