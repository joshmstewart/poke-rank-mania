
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

  // ENHANCED: Ultra-detailed sync function with comprehensive logging
  const syncWithTrueSkillStore = React.useCallback(async () => {
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] ===== STARTING ENHANCED SYNC =====`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Trigger source: ${new Error().stack?.split('\n')[2]?.trim()}`);
    
    // Get all TrueSkill ratings
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] ===== TRUESKILL STORE STATE =====`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] TrueSkill ratings found: ${ratedPokemonIds.length}`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Rating IDs: ${ratedPokemonIds.slice(0, 10).join(', ')}${ratedPokemonIds.length > 10 ? '...' : ''}`);
    
    // Sample a few ratings for verification
    if (ratedPokemonIds.length > 0) {
      const sampleId = ratedPokemonIds[0];
      const sampleRating = allRatings[sampleId];
      console.log(`🔥 [MANUAL_SYNC_ENHANCED] Sample rating (ID ${sampleId}): μ=${sampleRating.mu.toFixed(2)}, σ=${sampleRating.sigma.toFixed(2)}, battles=${sampleRating.battleCount}`);
    }
    
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] ===== POKEMON CONTEXT STATE =====`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] PokemonContext lookup map size: ${pokemonLookupMap.size}`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Available Pokemon count: ${availablePokemon.length}`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Ranked Pokemon count: ${rankedPokemon.length}`);
    
    // If no TrueSkill ratings, clear and exit
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥 [MANUAL_SYNC_ENHANCED] No TrueSkill ratings - clearing Manual mode lists`);
      setRankedPokemon([]);
      setAvailablePokemon([]);
      return;
    }

    // CRITICAL FIX: Check if PokemonContext data is ready
    let allAvailablePokemon = Array.from(pokemonLookupMap.values());
    
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] ===== POKEMON DATA AVAILABILITY CHECK =====`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Pokemon from context: ${allAvailablePokemon.length}`);
    
    // If context is not ready, try fallback methods
    if (allAvailablePokemon.length === 0) {
      console.log(`🔥 [MANUAL_SYNC_ENHANCED] ⚠️ PokemonContext not ready - trying fallbacks`);
      
      // Try current Manual mode data
      const currentPokemon = [...availablePokemon, ...rankedPokemon];
      const pokemonMap = new Map();
      currentPokemon.forEach(pokemon => pokemonMap.set(pokemon.id, pokemon));
      allAvailablePokemon = Array.from(pokemonMap.values());
      
      console.log(`🔥 [MANUAL_SYNC_ENHANCED] Fallback data from current lists: ${allAvailablePokemon.length} Pokemon`);
      
      // If still no data, we need to wait for context to load
      if (allAvailablePokemon.length === 0) {
        console.log(`🔥 [MANUAL_SYNC_ENHANCED] ❌ NO DATA AVAILABLE - Will retry when context loads`);
        console.log(`🔥 [MANUAL_SYNC_ENHANCED] This is normal during initial app load - waiting for Pokemon data`);
        return; // Exit gracefully, will retry when context updates
      }
    } else {
      console.log(`🔥 [MANUAL_SYNC_ENHANCED] ✅ Using PokemonContext data: ${allAvailablePokemon.length} Pokemon`);
    }

    console.log(`🔥 [MANUAL_SYNC_ENHANCED] ===== STARTING POKEMON MAPPING =====`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Will attempt to map ${ratedPokemonIds.length} ratings to ${allAvailablePokemon.length} Pokemon`);

    // Convert TrueSkill ratings to RankedPokemon
    const convertedRankings: RankedPokemon[] = [];
    const unratedPokemon: RankedPokemon[] = [];
    let mappingSuccessCount = 0;
    let mappingFailureCount = 0;

    allAvailablePokemon.forEach(pokemon => {
      if (ratedPokemonIds.includes(pokemon.id)) {
        try {
          const trueskillRating = getRating(pokemon.id);
          const trueskillData = allRatings[pokemon.id];
          
          console.log(`🔥 [MANUAL_SYNC_ENHANCED] Mapping ${pokemon.name} (${pokemon.id}): μ=${trueskillRating.mu.toFixed(2)}, σ=${trueskillRating.sigma.toFixed(2)}`);
          
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
            console.log(`🔥 [MANUAL_SYNC_ENHANCED] Sample mapped Pokemon #${mappingSuccessCount}:`, {
              name: rankedPokemon.name,
              id: rankedPokemon.id,
              score: rankedPokemon.score.toFixed(2),
              confidence: rankedPokemon.confidence.toFixed(1),
              battles: rankedPokemon.count
            });
          }
        } catch (error) {
          console.error(`🔥 [MANUAL_SYNC_ENHANCED] ❌ Error processing Pokemon ${pokemon.id}:`, error);
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

    // Sort ranked Pokemon by score descending
    convertedRankings.sort((a, b) => b.score - a.score);

    console.log(`🔥 [MANUAL_SYNC_ENHANCED] ===== MAPPING RESULTS =====`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Successfully mapped: ${mappingSuccessCount} Pokemon`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Mapping failures: ${mappingFailureCount} Pokemon`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Total ranked Pokemon: ${convertedRankings.length}`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] Total unrated Pokemon: ${unratedPokemon.length}`);
    
    if (convertedRankings.length > 0) {
      const top3 = convertedRankings.slice(0, 3);
      console.log(`🔥 [MANUAL_SYNC_ENHANCED] Top 3 ranked Pokemon:`, 
        top3.map(p => `${p.name}(score: ${p.score.toFixed(2)}, battles: ${p.count})`));
    }
    
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] ===== UPDATING REACT STATE =====`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] About to call setRankedPokemon with ${convertedRankings.length} items`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] About to call setAvailablePokemon with ${unratedPokemon.length} items`);
    
    // Update state
    setRankedPokemon(convertedRankings);
    setAvailablePokemon(unratedPokemon);
    
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] ✅ React state update calls completed`);
    console.log(`🔥 [MANUAL_SYNC_ENHANCED] ===== SYNC PROCESS COMPLETE =====`);
  }, [getAllRatings, getRating, pokemonLookupMap, availablePokemon, rankedPokemon, setRankedPokemon, setAvailablePokemon]);

  // ENHANCED: Mount effect with detailed trigger logging
  useEffect(() => {
    console.log(`🔥 [MANUAL_MOUNT_ENHANCED] PokemonRanker mounted - checking sync conditions`);
    
    const performSync = async () => {
      console.log(`🔥 [MANUAL_MOUNT_ENHANCED] Mount triggered sync - dependency: initial mount`);
      await syncWithTrueSkillStore();
    };
    
    performSync();
  }, []); // Only run on mount

  // CRITICAL: Enhanced effect that waits for PokemonContext to be ready
  useEffect(() => {
    console.log(`🔥 [MANUAL_CONTEXT_READY] PokemonContext dependency changed - size: ${pokemonLookupMap.size}`);
    
    if (pokemonLookupMap.size > 0) {
      console.log(`🔥 [MANUAL_CONTEXT_READY] PokemonContext data is ready with ${pokemonLookupMap.size} Pokemon - checking if sync needed`);
      
      // Check if we have ratings but no ranked Pokemon (indicating we need to sync)
      const ratings = getAllRatings();
      const ratingsCount = Object.keys(ratings).length;
      
      console.log(`🔥 [MANUAL_CONTEXT_READY] Current state: ${ratingsCount} ratings, ${rankedPokemon.length} ranked Pokemon`);
      
      if (ratingsCount > 0 && rankedPokemon.length === 0) {
        console.log(`🔥 [MANUAL_CONTEXT_READY] ✅ Sync needed: Found ${ratingsCount} ratings but 0 ranked Pokemon - triggering sync`);
        syncWithTrueSkillStore();
      } else if (ratingsCount > 0 && rankedPokemon.length > 0) {
        console.log(`🔥 [MANUAL_CONTEXT_READY] Already synced: ${ratingsCount} ratings, ${rankedPokemon.length} ranked Pokemon`);
      } else if (ratingsCount === 0) {
        console.log(`🔥 [MANUAL_CONTEXT_READY] No ratings available - no sync needed`);
      }
    } else {
      console.log(`🔥 [MANUAL_CONTEXT_READY] PokemonContext not ready yet - waiting`);
    }
  }, [pokemonLookupMap.size, getAllRatings, rankedPokemon.length, syncWithTrueSkillStore]);

  // Enhanced event listeners for TrueSkill updates
  useEffect(() => {
    const handleTrueSkillUpdate = async (event: CustomEvent) => {
      console.log(`🔥 [MANUAL_EVENT_ENHANCED] TrueSkill update event: ${event.type}`, event.detail);
      
      // Wait for store to be fully updated
      setTimeout(async () => {
        const ratings = getAllRatings();
        console.log(`🔥 [MANUAL_EVENT_ENHANCED] Store check after event: ${Object.keys(ratings).length} ratings`);
        
        // Only sync if we have context data ready
        if (pokemonLookupMap.size > 0) {
          console.log(`🔥 [MANUAL_EVENT_ENHANCED] Context ready - triggering sync after event`);
          await syncWithTrueSkillStore();
        } else {
          console.log(`🔥 [MANUAL_EVENT_ENHANCED] Context not ready - will sync when context loads`);
        }
      }, 150);
    };

    const handleTrueSkillCleared = () => {
      console.log(`🔥 [MANUAL_EVENT_ENHANCED] TrueSkill store cleared - resetting Manual mode`);
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
    console.log(`🔥 [MANUAL_TOGGLE] Toggling rankings view from ${showRankings} to ${!showRankings}`);
    console.log(`🔥 [MANUAL_TOGGLE] Current state: ${rankedPokemon.length} ranked Pokemon, ${availablePokemon.length} available Pokemon`);
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
