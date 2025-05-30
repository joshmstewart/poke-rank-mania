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

  // FIXED: Enhanced sync that properly waits for PokemonContext data
  const syncWithTrueSkillStore = React.useCallback(async () => {
    console.log(`🔄 [MANUAL_SYNC_FIXED] ===== STARTING ENHANCED SYNC =====`);
    
    // Get all TrueSkill ratings
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔄 [MANUAL_SYNC_FIXED] TrueSkill ratings found: ${ratedPokemonIds.length}`);
    console.log(`🔄 [MANUAL_SYNC_FIXED] PokemonContext lookup map size: ${pokemonLookupMap.size}`);
    console.log(`🔄 [MANUAL_SYNC_FIXED] Available Pokemon count: ${availablePokemon.length}`);
    console.log(`🔄 [MANUAL_SYNC_FIXED] Ranked Pokemon count: ${rankedPokemon.length}`);
    
    // If no TrueSkill ratings, clear and exit
    if (ratedPokemonIds.length === 0) {
      console.log(`🔄 [MANUAL_SYNC_FIXED] No TrueSkill ratings - clearing Manual mode lists`);
      setRankedPokemon([]);
      setAvailablePokemon([]);
      return;
    }

    // CRITICAL FIX: Check if PokemonContext data is ready
    let allAvailablePokemon = Array.from(pokemonLookupMap.values());
    
    // If context is not ready, try fallback methods
    if (allAvailablePokemon.length === 0) {
      console.log(`🔄 [MANUAL_SYNC_FIXED] PokemonContext not ready - trying fallbacks`);
      
      // Try current Manual mode data
      const currentPokemon = [...availablePokemon, ...rankedPokemon];
      const pokemonMap = new Map();
      currentPokemon.forEach(pokemon => pokemonMap.set(pokemon.id, pokemon));
      allAvailablePokemon = Array.from(pokemonMap.values());
      
      console.log(`🔄 [MANUAL_SYNC_FIXED] Fallback data: ${allAvailablePokemon.length} Pokemon`);
      
      // If still no data, we need to wait for context to load
      if (allAvailablePokemon.length === 0) {
        console.log(`🔄 [MANUAL_SYNC_FIXED] NO DATA AVAILABLE - Will retry when context loads`);
        console.log(`🔄 [MANUAL_SYNC_FIXED] This is normal during initial app load - waiting for Pokemon data`);
        return; // Exit gracefully, will retry when context updates
      }
    } else {
      console.log(`🔄 [MANUAL_SYNC_FIXED] ✅ Using PokemonContext data: ${allAvailablePokemon.length} Pokemon`);
    }

    // Convert TrueSkill ratings to RankedPokemon
    const convertedRankings: RankedPokemon[] = [];
    const unratedPokemon: RankedPokemon[] = [];

    console.log(`🔄 [MANUAL_SYNC_FIXED] Starting conversion for ${allAvailablePokemon.length} total Pokemon`);

    allAvailablePokemon.forEach(pokemon => {
      if (ratedPokemonIds.includes(pokemon.id)) {
        try {
          const trueskillRating = getRating(pokemon.id);
          const trueskillData = allRatings[pokemon.id];
          
          console.log(`🔄 [MANUAL_SYNC_FIXED] Converting ${pokemon.name}: μ=${trueskillRating.mu.toFixed(2)}, σ=${trueskillRating.sigma.toFixed(2)}`);
          
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
        } catch (error) {
          console.error(`🔄 [MANUAL_SYNC_FIXED] ❌ Error processing Pokemon ${pokemon.id}:`, error);
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

    console.log(`🔄 [MANUAL_SYNC_FIXED] ✅ Conversion complete:`);
    console.log(`🔄 [MANUAL_SYNC_FIXED] - ${convertedRankings.length} ranked Pokemon`);
    console.log(`🔄 [MANUAL_SYNC_FIXED] - ${unratedPokemon.length} unrated Pokemon`);
    
    if (convertedRankings.length > 0) {
      console.log(`🔄 [MANUAL_SYNC_FIXED] Top 3 ranked:`, convertedRankings.slice(0, 3).map(p => `${p.name}(${p.score.toFixed(2)})`));
    }
    
    // Update state
    console.log(`🔄 [MANUAL_SYNC_FIXED] ✅ Updating state with ${convertedRankings.length} ranked and ${unratedPokemon.length} unrated`);
    setRankedPokemon(convertedRankings);
    setAvailablePokemon(unratedPokemon);
    
    console.log(`🔄 [MANUAL_SYNC_FIXED] State updated successfully`);
  }, [getAllRatings, getRating, pokemonLookupMap, availablePokemon, rankedPokemon, setRankedPokemon, setAvailablePokemon]);

  // FIXED: Enhanced mount effect with proper context dependency
  useEffect(() => {
    console.log(`🔄 [MANUAL_MOUNT_FIXED] PokemonRanker mounted - checking sync conditions`);
    
    const performSync = async () => {
      console.log(`🔄 [MANUAL_MOUNT_FIXED] Attempting sync...`);
      await syncWithTrueSkillStore();
    };
    
    performSync();
  }, []); // Only run on mount

  // CRITICAL: New effect that waits for PokemonContext to be ready
  useEffect(() => {
    if (pokemonLookupMap.size > 0) {
      console.log(`🔄 [MANUAL_CONTEXT_READY] PokemonContext data is ready with ${pokemonLookupMap.size} Pokemon - triggering sync`);
      
      // Check if we have ratings but no ranked Pokemon (indicating we need to sync)
      const ratings = getAllRatings();
      const ratingsCount = Object.keys(ratings).length;
      
      if (ratingsCount > 0 && rankedPokemon.length === 0) {
        console.log(`🔄 [MANUAL_CONTEXT_READY] Found ${ratingsCount} ratings but 0 ranked Pokemon - syncing now`);
        syncWithTrueSkillStore();
      }
    }
  }, [pokemonLookupMap.size, getAllRatings, rankedPokemon.length, syncWithTrueSkillStore]);

  // Enhanced event listeners for TrueSkill updates
  useEffect(() => {
    const handleTrueSkillUpdate = async (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_EVENT_FIXED] TrueSkill update event: ${event.type}`, event.detail);
      
      // Wait for store to be fully updated
      setTimeout(async () => {
        const ratings = getAllRatings();
        console.log(`🔄 [MANUAL_EVENT_FIXED] Store check after event: ${Object.keys(ratings).length} ratings`);
        
        // Only sync if we have context data ready
        if (pokemonLookupMap.size > 0) {
          await syncWithTrueSkillStore();
        } else {
          console.log(`🔄 [MANUAL_EVENT_FIXED] Context not ready - will sync when context loads`);
        }
      }, 150);
    };

    const handleTrueSkillCleared = () => {
      console.log(`🔄 [MANUAL_EVENT_FIXED] TrueSkill store cleared - resetting Manual mode`);
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
  }, [syncWithTrueSkillStore, getAllRatings, pokemonLookupMap.size]);

  // Convert rankedPokemon to ensure proper RankedPokemon type
  const typedRankedPokemon: RankedPokemon[] = rankedPokemon.map(pokemon => {
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
    
    localStorage.removeItem('pokemon-active-suggestions');
    console.log("✅ [MANUAL_RESET_FIXED] Cleared pokemon-active-suggestions from localStorage");
    
    clearAllRatings();
    console.log("✅ [MANUAL_RESET_FIXED] Cleared centralized TrueSkill store");
    
    resetRankings();
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
