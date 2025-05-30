
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

  // FIXED: Enhanced sync function that properly waits for context
  const syncWithTrueSkillStore = React.useCallback(async () => {
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== SYNC FUNCTION ENTRY =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Trigger source: ${new Error().stack?.split('\n')[2]?.trim()}`);
    
    // CRITICAL: Check context readiness FIRST before any other operations
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== CONTEXT READINESS CHECK =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] PokemonContext lookup map size: ${pokemonLookupMap.size}`);
    
    if (pokemonLookupMap.size === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ⚠️ CONTEXT NOT READY - Pokémon lookup map is empty`);
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ❌ DEFERRING SYNC - Will wait for context to be populated`);
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] This is expected on initial load, sync will re-run when context is ready`);
      return; // Exit early, don't process anything without context
    }

    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ✅ CONTEXT IS READY - Proceeding with full sync`);
    
    // Get all TrueSkill ratings - only after context is confirmed ready
    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== TRUESKILL STORE STATE =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] TrueSkill ratings found: ${ratedPokemonIds.length}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Rating IDs: ${ratedPokemonIds.slice(0, 15).join(', ')}${ratedPokemonIds.length > 15 ? '...' : ''}`);
    
    // If no TrueSkill ratings, clear and exit
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] No TrueSkill ratings - clearing Manual mode lists`);
      setRankedPokemon([]);
      setAvailablePokemon([]);
      return;
    }

    // Get Pokemon data from context
    const allAvailablePokemon = Array.from(pokemonLookupMap.values());
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== POKEMON DATA PROCESSING =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Pokemon from context: ${allAvailablePokemon.length}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Will map ${ratedPokemonIds.length} ratings to Pokemon`);

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

    // Sort ranked Pokemon by score descending
    convertedRankings.sort((a, b) => b.score - a.score);

    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] ===== MAPPING RESULTS =====`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Successfully mapped: ${mappingSuccessCount} Pokemon`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_ULTRA_CRITICAL] Mapping failures: ${mappingFailureCount} Pokemon`);
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
  }, [getAllRatings, getRating, pokemonLookupMap, setRankedPokemon, setAvailablePokemon]);

  // FIXED: Primary effect that only runs when BOTH conditions are met
  useEffect(() => {
    console.log(`🔥🔥🔥 [MANUAL_PRIMARY_SYNC] ===== PRIMARY SYNC EFFECT TRIGGERED =====`);
    console.log(`🔥🔥🔥 [MANUAL_PRIMARY_SYNC] Context size: ${pokemonLookupMap.size}`);
    
    const ratings = getAllRatings();
    const ratingsCount = Object.keys(ratings).length;
    console.log(`🔥🔥🔥 [MANUAL_PRIMARY_SYNC] Ratings count: ${ratingsCount}`);
    
    // CRITICAL: Only proceed if BOTH context is ready AND we have data to work with
    if (pokemonLookupMap.size > 0) {
      console.log(`🔥🔥🔥 [MANUAL_PRIMARY_SYNC] ✅ Context ready with ${pokemonLookupMap.size} Pokemon`);
      
      if (ratingsCount > 0) {
        console.log(`🔥🔥🔥 [MANUAL_PRIMARY_SYNC] ✅ Ratings available: ${ratingsCount} - TRIGGERING FULL SYNC`);
        syncWithTrueSkillStore();
      } else {
        console.log(`🔥🔥🔥 [MANUAL_PRIMARY_SYNC] No ratings available - clearing display`);
        setRankedPokemon([]);
        setAvailablePokemon([]);
      }
    } else {
      console.log(`🔥🔥🔥 [MANUAL_PRIMARY_SYNC] Context not ready yet - will wait for context to load`);
      console.log(`🔥🔥🔥 [MANUAL_PRIMARY_SYNC] Effect will re-run when pokemonLookupMap.size changes`);
    }
  }, [pokemonLookupMap.size, getAllRatings, syncWithTrueSkillStore, setRankedPokemon, setAvailablePokemon]);

  // Enhanced event listeners for TrueSkill updates
  useEffect(() => {
    const handleTrueSkillUpdate = async (event: CustomEvent) => {
      console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] TrueSkill event: ${event.type}`, event.detail);
      
      // Wait for store to be fully updated
      setTimeout(async () => {
        const ratings = getAllRatings();
        console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] Store after event: ${Object.keys(ratings).length} ratings`);
        console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] Context size: ${pokemonLookupMap.size}`);
        
        // Only sync if we have BOTH context data ready AND ratings
        if (pokemonLookupMap.size > 0 && Object.keys(ratings).length > 0) {
          console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] Both context and ratings ready - triggering sync after event`);
          await syncWithTrueSkillStore();
        } else {
          console.log(`🔥🔥🔥 [MANUAL_EVENT_ULTRA_CRITICAL] Waiting for both context (${pokemonLookupMap.size}) and ratings (${Object.keys(ratings).length}) to be ready`);
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
  }, [syncWithTrueSkillStore, getAllRatings, pokemonLookupMap.size, setRankedPokemon, setAvailablePokemon]);

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
