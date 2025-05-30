
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

  // FIXED: Enhanced sync with proper store clearing handling
  useEffect(() => {
    console.log(`🔄 [MANUAL_SYNC_ENHANCED] ===== SYNCING MANUAL MODE WITH TRUESKILL STORE =====`);
    
    const syncWithTrueSkillStore = () => {
      const allRatings = getAllRatings();
      const ratedPokemonIds = Object.keys(allRatings).map(Number);
      
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] Found ${ratedPokemonIds.length} Pokemon with TrueSkill ratings`);
      
      // CRITICAL FIX: Handle store clearing first
      if (ratedPokemonIds.length === 0) {
        console.log(`🔄 [MANUAL_SYNC_ENHANCED] No TrueSkill ratings found - clearing Manual rankings completely`);
        
        // Get all Pokemon from context map OR current state
        let allAvailablePokemon = [];
        
        if (pokemonLookupMap.size > 0) {
          allAvailablePokemon = Array.from(pokemonLookupMap.values());
          console.log(`🔄 [MANUAL_SYNC_ENHANCED] Using Pokemon context map: ${allAvailablePokemon.length} Pokemon`);
        } else {
          // Fallback: combine current available and ranked Pokemon to get full list
          const combinedPokemon = [...availablePokemon, ...rankedPokemon];
          const pokemonMap = new Map();
          combinedPokemon.forEach(pokemon => {
            pokemonMap.set(pokemon.id, pokemon);
          });
          allAvailablePokemon = Array.from(pokemonMap.values());
          console.log(`🔄 [MANUAL_SYNC_ENHANCED] Using combined Pokemon from state: ${allAvailablePokemon.length} Pokemon`);
        }
        
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
        
        console.log(`🔄 [MANUAL_SYNC_ENHANCED] ✅ Clearing all rankings - setting ${unratedPokemon.length} Pokemon as unrated`);
        setRankedPokemon([]);
        setAvailablePokemon(unratedPokemon);
        return;
      }

      // Get Pokemon data - prioritize context map but fall back to current state
      let allAvailablePokemon = [];
      
      if (pokemonLookupMap.size > 0) {
        allAvailablePokemon = Array.from(pokemonLookupMap.values());
        console.log(`🔄 [MANUAL_SYNC_ENHANCED] Using Pokemon context map: ${allAvailablePokemon.length} Pokemon`);
      } else {
        // Combine current arrays to get all Pokemon
        const combinedPokemon = [...availablePokemon, ...rankedPokemon];
        const pokemonMap = new Map();
        combinedPokemon.forEach(pokemon => {
          pokemonMap.set(pokemon.id, pokemon);
        });
        allAvailablePokemon = Array.from(pokemonMap.values());
        console.log(`🔄 [MANUAL_SYNC_ENHANCED] Using combined Pokemon from state: ${allAvailablePokemon.length} Pokemon`);
      }

      if (allAvailablePokemon.length === 0) {
        console.log(`🔄 [MANUAL_SYNC_ENHANCED] No Pokemon data available - waiting...`);
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

      console.log(`🔄 [MANUAL_SYNC_ENHANCED] ✅ Converted ${convertedRankings.length} ranked Pokemon, ${unratedPokemon.length} unrated`);
      
      // Update Manual mode with separated Pokemon
      setRankedPokemon(convertedRankings);
      setAvailablePokemon(unratedPokemon);
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] ✅ Manual mode updated successfully`);
    };

    // Only sync if we have Pokemon data from some source
    const hasContextData = pokemonLookupMap.size > 0;
    const hasStateData = availablePokemon.length > 0 || rankedPokemon.length > 0;
    
    if (hasContextData || hasStateData) {
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] Data ready - syncing...`);
      syncWithTrueSkillStore();
    } else {
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] No Pokemon data available yet, waiting...`);
    }

    // Enhanced event listeners for store updates and clearing
    const handleTrueSkillUpdate = (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] TrueSkill store updated, re-syncing...`, event.type);
      setTimeout(() => {
        syncWithTrueSkillStore();
      }, 50);
    };

    const handleTrueSkillCleared = (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_SYNC_ENHANCED] TrueSkill store CLEARED, resetting Manual mode...`);
      setTimeout(() => {
        syncWithTrueSkillStore();
      }, 50);
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
  }, [getAllRatings, getRating, pokemonLookupMap.size, availablePokemon.length, rankedPokemon.length, setRankedPokemon, setAvailablePokemon]);

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
