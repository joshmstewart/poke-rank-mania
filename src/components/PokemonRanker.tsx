
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

  // FIXED: Comprehensive sync with proper clearing support
  useEffect(() => {
    console.log(`🔄 [MANUAL_SYNC_FIXED] ===== SYNCING MANUAL MODE WITH TRUESKILL STORE =====`);
    
    const syncWithTrueSkillStore = () => {
      const allRatings = getAllRatings();
      const ratedPokemonIds = Object.keys(allRatings).map(Number);
      
      console.log(`🔄 [MANUAL_SYNC_FIXED] Found ${ratedPokemonIds.length} Pokemon with TrueSkill ratings`);
      
      // Get ALL Pokemon from context map
      const allAvailablePokemon = Array.from(pokemonLookupMap.values());
      console.log(`🔄 [MANUAL_SYNC_FIXED] Total Pokemon in context: ${allAvailablePokemon.length}`);

      if (allAvailablePokemon.length === 0) {
        console.log(`🔄 [MANUAL_SYNC_FIXED] No Pokemon in context map yet - waiting...`);
        return;
      }

      // FIXED: Handle both populated and cleared store states
      if (ratedPokemonIds.length === 0) {
        console.log(`🔄 [MANUAL_SYNC_FIXED] No TrueSkill ratings found - clearing Manual rankings`);
        
        // Convert all Pokemon to unrated format
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
        console.log(`🔄 [MANUAL_SYNC_FIXED] ✅ Cleared Manual rankings - ${unratedPokemon.length} Pokemon now unrated`);
        return;
      }

      // Separate ALL Pokemon into rated and unrated
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

      console.log(`🔄 [MANUAL_SYNC_FIXED] ✅ Converted ${convertedRankings.length} ranked Pokemon, ${unratedPokemon.length} unrated`);
      
      // Update Manual mode with ALL Pokemon
      setRankedPokemon(convertedRankings);
      setAvailablePokemon(unratedPokemon);
      console.log(`🔄 [MANUAL_SYNC_FIXED] ✅ Manual mode updated with ALL Pokemon data`);
    };

    // Only sync if we have Pokemon context data
    if (pokemonLookupMap.size > 0) {
      syncWithTrueSkillStore();
    } else {
      console.log(`🔄 [MANUAL_SYNC_FIXED] Pokemon context not ready yet, waiting...`);
    }

    // FIXED: Enhanced event listeners for store updates and clearing
    const handleTrueSkillUpdate = (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_SYNC_FIXED] TrueSkill store updated, re-syncing Manual mode...`, event.type);
      if (pokemonLookupMap.size > 0) {
        setTimeout(() => {
          syncWithTrueSkillStore();
        }, 50);
      }
    };

    const handleTrueSkillCleared = (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_SYNC_FIXED] TrueSkill store CLEARED, resetting Manual mode...`);
      if (pokemonLookupMap.size > 0) {
        setTimeout(() => {
          syncWithTrueSkillStore();
        }, 50);
      }
    };

    // Add event listeners
    document.addEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-cleared', handleTrueSkillCleared as EventListener);
    document.addEventListener('manual-mode-reset', handleTrueSkillCleared as EventListener);
    document.addEventListener('battle-system-reset', handleTrueSkillCleared as EventListener);

    // Cleanup
    return () => {
      document.removeEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-cleared', handleTrueSkillCleared as EventListener);
      document.removeEventListener('manual-mode-reset', handleTrueSkillCleared as EventListener);
      document.removeEventListener('battle-system-reset', handleTrueSkillCleared as EventListener);
    };
  }, [getAllRatings, getRating, pokemonLookupMap, setRankedPokemon, setAvailablePokemon]);

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
    console.log("🔄 [MANUAL_RESET_FIXED] Starting complete reset of Manual Mode");
    
    // Clear suggestion arrows explicitly on reset
    localStorage.removeItem('pokemon-active-suggestions');
    console.log("✅ [MANUAL_RESET_FIXED] Cleared pokemon-active-suggestions from localStorage");
    
    // Clear centralized TrueSkill store
    clearAllRatings();
    console.log("✅ [MANUAL_RESET_FIXED] Cleared centralized TrueSkill store");
    
    // Reset rankings
    resetRankings();
    
    // Clear suggestions
    clearAllSuggestions();
    
    console.log("✅ [MANUAL_RESET_FIXED] Manual Mode rankings and suggestions fully reset");
    
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
