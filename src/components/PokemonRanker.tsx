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

  // ULTRA-ENHANCED: Sync function with guaranteed console output
  const syncWithTrueSkillStore = React.useCallback(async () => {
    // Force console output with critical priority logging
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== SYNC FUNCTION ENTRY =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Trigger source: ${new Error().stack?.split('\n')[2]?.trim()}`);
    
    // Get all TrueSkill ratings - LOG IMMEDIATELY
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== TRUESKILL STORE STATE =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] TrueSkill ratings found: ${ratedPokemonIds.length}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Rating IDs: ${ratedPokemonIds.slice(0, 15).join(', ')}${ratedPokemonIds.length > 15 ? '...' : ''}`);
    
    // Sample a few ratings for verification
    if (ratedPokemonIds.length > 0) {
      const sampleIds = ratedPokemonIds.slice(0, 3);
      sampleIds.forEach(id => {
        const rating = allRatings[id];
        console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Sample rating (ID ${id}): μ=${rating.mu.toFixed(2)}, σ=${rating.sigma.toFixed(2)}, battles=${rating.battleCount}`);
      });
    }
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== POKEMON CONTEXT STATE =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] PokemonContext lookup map size: ${pokemonLookupMap.size}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Available Pokemon count: ${availablePokemon.length}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Ranked Pokemon count: ${rankedPokemon.length}`);
    
    // If no TrueSkill ratings, clear and exit
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] No TrueSkill ratings - clearing Manual mode lists`);
      setRankedPokemon([]);
      setAvailablePokemon([]);
      return;
    }

    // CRITICAL CHECK: PokemonContext data readiness
    let allAvailablePokemon = Array.from(pokemonLookupMap.values());
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== POKEMON DATA AVAILABILITY =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Pokemon from context: ${allAvailablePokemon.length}`);
    
    // If context is not ready, try fallback methods
    if (allAvailablePokemon.length === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ⚠️ PokemonContext not ready - using fallback`);
      
      // Try current Manual mode data
      const currentPokemon = [...availablePokemon, ...rankedPokemon];
      const pokemonMap = new Map();
      currentPokemon.forEach(pokemon => pokemonMap.set(pokemon.id, pokemon));
      allAvailablePokemon = Array.from(pokemonMap.values());
      
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Fallback data: ${allAvailablePokemon.length} Pokemon`);
      
      if (allAvailablePokemon.length === 0) {
        console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ❌ NO DATA AVAILABLE - exiting sync`);
        return;
      }
    } else {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ✅ Using PokemonContext data: ${allAvailablePokemon.length} Pokemon`);
    }

    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== POKEMON MAPPING PROCESS =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Will map ${ratedPokemonIds.length} ratings to ${allAvailablePokemon.length} Pokemon`);

    // Convert TrueSkill ratings to RankedPokemon
    const convertedRankings: RankedPokemon[] = [];
    const unratedPokemon: RankedPokemon[] = [];
    let mappingSuccessCount = 0;
    let mappingFailureCount = 0;
    let contextMissCount = 0;

    allAvailablePokemon.forEach(pokemon => {
      if (ratedPokemonIds.includes(pokemon.id)) {
        try {
          const trueskillRating = getRating(pokemon.id);
          const trueskillData = allRatings[pokemon.id];
          
          console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Mapping ${pokemon.name} (${pokemon.id}): μ=${trueskillRating.mu.toFixed(2)}, σ=${trueskillRating.sigma.toFixed(2)}`);
          
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
          mappingSuccessCount++;
          
          if (mappingSuccessCount <= 3) {
            console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Sample mapped Pokemon #${mappingSuccessCount}:`, {
              name: rankedPokemon.name,
              id: rankedPokemon.id,
              score: rankedPokemon.score.toFixed(2),
              confidence: rankedPokemon.confidence.toFixed(1),
              battles: rankedPokemon.count
            });
          }
        } catch (error) {
          console.error(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ❌ Error processing Pokemon ${pokemon.id}:`, error);
          mappingFailureCount++;
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

    // Check for ratings that couldn't find Pokemon in context
    ratedPokemonIds.forEach(ratingId => {
      const foundInContext = allAvailablePokemon.find(p => p.id === ratingId);
      if (!foundInContext) {
        contextMissCount++;
        if (contextMissCount <= 5) {
          console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ⚠️ Rating ID ${ratingId} not found in Pokemon context`);
        }
      }
    });

    // Sort ranked Pokemon by score descending
    convertedRankings.sort((a, b) => b.score - a.score);

    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== MAPPING RESULTS =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Successfully mapped: ${mappingSuccessCount} Pokemon`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Mapping failures: ${mappingFailureCount} Pokemon`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Context misses: ${contextMissCount} ratings`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Total ranked Pokemon: ${convertedRankings.length}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Total unrated Pokemon: ${unratedPokemon.length}`);
    
    if (convertedRankings.length > 0) {
      const top3 = convertedRankings.slice(0, 3);
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Top 3 ranked:`, 
        top3.map(p => `${p.name}(score: ${p.score.toFixed(2)}, battles: ${p.count})`));
    }
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== UPDATING REACT STATE =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] About to call setRankedPokemon with ${convertedRankings.length} items`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] About to call setAvailablePokemon with ${unratedPokemon.length} items`);
    
    // Update state
    setRankedPokemon(convertedRankings);
    setAvailablePokemon(unratedPokemon);
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ✅ React state update calls completed`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== SYNC PROCESS COMPLETE =====`);
  }, [getAllRatings, getRating, pokemonLookupMap, availablePokemon, rankedPokemon, setRankedPokemon, setAvailablePokemon]);

  // Mount effect with logging
  useEffect(() => {
    console.log(`🔥🔥🔥 [MANUAL_MOUNT_ULTRA_CRITICAL] PokemonRanker mounted - triggering initial sync`);
    
    const performSync = async () => {
      console.log(`🔥🔥🔥 [MANUAL_MOUNT_ULTRA_CRITICAL] Mount triggered sync starting`);
      await syncWithTrueSkillStore();
    };
    
    performSync();
  }, []); // Only run on mount

  // Context readiness effect
  useEffect(() => {
    console.log(`🔥🔥🔥 [MANUAL_CONTEXT_ULTRA_CRITICAL] Context dependency changed - size: ${pokemonLookupMap.size}`);
    
    if (pokemonLookupMap.size > 0) {
      console.log(`🔥🔥🔥 [MANUAL_CONTEXT_ULTRA_CRITICAL] Context ready with ${pokemonLookupMap.size} Pokemon`);
      
      // Check if we have ratings but no ranked Pokemon
      const ratings = getAllRatings();
      const ratingsCount = Object.keys(ratings).length;
      
      console.log(`🔥🔥🔥 [MANUAL_CONTEXT_ULTRA_CRITICAL] Current state: ${ratingsCount} ratings, ${rankedPokemon.length} ranked Pokemon`);
      
      if (ratingsCount > 0 && rankedPokemon.length === 0) {
        console.log(`🔥🔥🔥 [MANUAL_CONTEXT_ULTRA_CRITICAL] ✅ Sync needed: ${ratingsCount} ratings but 0 ranked Pokemon`);
        syncWithTrueSkillStore();
      } else if (ratingsCount > 0 && rankedPokemon.length > 0) {
        console.log(`🔥🔥🔥 [MANUAL_CONTEXT_ULTRA_CRITICAL] Already synced: ${ratingsCount} ratings, ${rankedPokemon.length} ranked Pokemon`);
      } else if (ratingsCount === 0) {
        console.log(`🔥🔥🔥 [MANUAL_CONTEXT_ULTRA_CRITICAL] No ratings available - no sync needed`);
      }
    } else {
      console.log(`🔥🔥🔥 [MANUAL_CONTEXT_ULTRA_CRITICAL] Context not ready yet - waiting`);
    }
  }, [pokemonLookupMap.size, getAllRatings, rankedPokemon.length, syncWithTrueSkillStore]);

  // Enhanced event listeners for TrueSkill updates
  useEffect(() => {
    const handleTrueSkillUpdate = async (event: CustomEvent) => {
      console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] TrueSkill event: ${event.type}`, event.detail);
      
      // Wait for store to be fully updated
      setTimeout(async () => {
        const ratings = getAllRatings();
        console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] Store after event: ${Object.keys(ratings).length} ratings`);
        
        // Only sync if we have context data ready
        if (pokemonLookupMap.size > 0) {
          console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] Context ready - triggering sync after event`);
          await syncWithTrueSkillStore();
        } else {
          console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] Context not ready - will sync when context loads`);
        }
      }, 150);
    };

    const handleTrueSkillCleared = () => {
      console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] TrueSkill store cleared - resetting Manual mode`);
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
    console.log("🔄 [MANUAL_RESET_ENHANCED] Starting complete reset of Manual Mode");
    
    localStorage.removeItem('pokemon-active-suggestions');
    console.log("✅ [MANUAL_RESET_ENHANCED] Cleared pokemon-active-suggestions from localStorage");
    
    clearAllRatings();
    console.log("✅ [MANUAL_RESET_ENHANCED] Cleared centralized TrueSkill store");
    
    resetRankings();
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
    console.log(`🔥🔥🔥 [MANUAL_TOGGLE_ULTRA_CRITICAL] Toggling rankings view from ${showRankings} to ${!showRankings}`);
    console.log(`🔥🔥🔥 [MANUAL_TOGGLE_ULTRA_CRITICAL] Current state: ${rankedPokemon.length} ranked Pokemon, ${availablePokemon.length} available Pokemon`);
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
