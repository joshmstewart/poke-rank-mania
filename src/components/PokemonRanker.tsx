
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

  // ENHANCED: More robust sync with better debugging
  const syncWithTrueSkillStore = React.useCallback(async () => {
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] ===== STARTING ENHANCED SYNC =====`);
    
    // Get all TrueSkill ratings with extensive logging
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] TrueSkill store accessed`);
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] Raw ratings object:`, allRatings);
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] Found ${ratedPokemonIds.length} Pokemon with TrueSkill ratings:`, ratedPokemonIds);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] No TrueSkill ratings found - clearing Manual mode lists`);
      setRankedPokemon([]);
      setAvailablePokemon([]);
      return;
    }

    // FIXED: More robust Pokemon data retrieval
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] Context lookup map size:`, pokemonLookupMap.size);
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] Available Pokemon count:`, availablePokemon.length);
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] Ranked Pokemon count:`, rankedPokemon.length);

    let allAvailablePokemon = Array.from(pokemonLookupMap.values());
    
    // ENHANCED: Multiple fallback strategies
    if (allAvailablePokemon.length === 0) {
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] Context empty - trying Manual mode fallback`);
      const currentPokemon = [...availablePokemon, ...rankedPokemon];
      const pokemonMap = new Map();
      currentPokemon.forEach(pokemon => pokemonMap.set(pokemon.id, pokemon));
      allAvailablePokemon = Array.from(pokemonMap.values());
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] Manual mode fallback: ${allAvailablePokemon.length} Pokemon`);
      
      if (allAvailablePokemon.length === 0) {
        console.log(`🔄 [MANUAL_SYNC_ENHANCED] Manual mode fallback also empty - will retry when data loads`);
        console.log(`🔄 [MANUAL_SYNC_ENHANCED] CRITICAL: No Pokemon data available from any source!`);
        console.log(`🔄 [MANUAL_SYNC_ENHANCED] Context size: ${pokemonLookupMap.size}`);
        console.log(`🔄 [MANUAL_SYNC_ENHANCED] Available: ${availablePokemon.length}, Ranked: ${rankedPokemon.length}`);
        return;
      }
    } else {
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] ✅ Using context data: ${allAvailablePokemon.length} Pokemon`);
    }

    // Convert TrueSkill ratings to RankedPokemon with detailed logging
    const convertedRankings: RankedPokemon[] = [];
    const unratedPokemon: RankedPokemon[] = [];

    console.log(`🔄 [MANUAL_SYNC_ENHANCED] Starting conversion for ${allAvailablePokemon.length} total Pokemon`);

    allAvailablePokemon.forEach(pokemon => {
      if (ratedPokemonIds.includes(pokemon.id)) {
        try {
          const trueskillRating = getRating(pokemon.id);
          const trueskillData = allRatings[pokemon.id];
          
          console.log(`🔄 [MANUAL_SYNC_ENHANCED] Processing rated Pokemon ${pokemon.id} (${pokemon.name})`);
          console.log(`🔄 [MANUAL_SYNC_ENHANCED] TrueSkill data:`, trueskillData);
          console.log(`🔄 [MANUAL_SYNC_ENHANCED] TrueSkill rating: μ=${trueskillRating.mu}, σ=${trueskillRating.sigma}`);
          
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
          console.log(`🔄 [MANUAL_SYNC_ENHANCED] ✅ Converted ${pokemon.name}: score=${conservativeEstimate.toFixed(2)}, confidence=${normalizedConfidence.toFixed(1)}%, battles=${trueskillData.battleCount}`);
        } catch (error) {
          console.error(`🔄 [MANUAL_SYNC_ENHANCED] ❌ Error processing Pokemon ${pokemon.id}:`, error);
        }
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

    console.log(`🔄 [MANUAL_SYNC_ENHANCED] ✅ Conversion complete:`);
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] - ${convertedRankings.length} ranked Pokemon`);
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] - ${unratedPokemon.length} unrated Pokemon`);
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] Top 5 ranked:`, convertedRankings.slice(0, 5).map(p => `${p.name}(${p.score.toFixed(2)})`));
    
    // CRITICAL: Always update state, even if 0 ranked Pokemon
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] ✅ Updating state with ${convertedRankings.length} ranked and ${unratedPokemon.length} unrated`);
    setRankedPokemon(convertedRankings);
    setAvailablePokemon(unratedPokemon);
    
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] State updated successfully`);
  }, [getAllRatings, getRating, pokemonLookupMap, availablePokemon, rankedPokemon, setRankedPokemon, setAvailablePokemon]);

  // CRITICAL: Enhanced mount effect with multiple sync attempts
  useEffect(() => {
    console.log(`🔄 [MANUAL_MOUNT_ENHANCED] PokemonRanker mounted - performing enhanced sync check`);
    
    // Multiple sync attempts with delays to handle timing issues
    const performMountSync = async () => {
      console.log(`🔄 [MANUAL_MOUNT_ENHANCED] Attempt 1: Immediate sync`);
      await syncWithTrueSkillStore();
      
      // Second attempt after short delay in case store is still loading
      setTimeout(async () => {
        console.log(`🔄 [MANUAL_MOUNT_ENHANCED] Attempt 2: Delayed sync (500ms)`);
        const ratings = getAllRatings();
        console.log(`🔄 [MANUAL_MOUNT_ENHANCED] Delayed check found ${Object.keys(ratings).length} ratings`);
        if (Object.keys(ratings).length > 0) {
          await syncWithTrueSkillStore();
        }
      }, 500);
      
      // Third attempt after longer delay
      setTimeout(async () => {
        console.log(`🔄 [MANUAL_MOUNT_ENHANCED] Attempt 3: Extended delay sync (1000ms)`);
        const ratings = getAllRatings();
        console.log(`🔄 [MANUAL_MOUNT_ENHANCED] Extended check found ${Object.keys(ratings).length} ratings`);
        if (Object.keys(ratings).length > 0) {
          await syncWithTrueSkillStore();
        }
      }, 1000);
    };
    
    performMountSync();
  }, []); // Only run on mount

  // CRITICAL: Enhanced event listeners for TrueSkill updates
  useEffect(() => {
    const handleTrueSkillUpdate = async (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_EVENT_ENHANCED] TrueSkill update event: ${event.type}`, event.detail);
      
      // Wait a bit to ensure store is fully updated
      setTimeout(async () => {
        const ratings = getAllRatings();
        console.log(`🔄 [MANUAL_EVENT_ENHANCED] Store check after event: ${Object.keys(ratings).length} ratings`);
        await syncWithTrueSkillStore();
      }, 150);
    };

    const handleTrueSkillCleared = () => {
      console.log(`🔄 [MANUAL_EVENT_ENHANCED] TrueSkill store cleared - resetting Manual mode`);
      setRankedPokemon([]);
      setAvailablePokemon([]);
    };

    // Listen for all TrueSkill events
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
  }, [syncWithTrueSkillStore, getAllRatings]);

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
