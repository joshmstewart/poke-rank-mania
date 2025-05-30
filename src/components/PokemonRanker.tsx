
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

  // CRITICAL FIX: Sync with TrueSkill store on component mount and when store updates
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

      // Convert TrueSkill ratings to Manual mode format - FIXED: Create proper RankedPokemon objects
      const convertedRankings: RankedPokemon[] = ratedPokemonIds
        .map(pokemonId => {
          const pokemon = pokemonLookupMap.get(pokemonId);
          if (!pokemon) {
            console.warn(`🔄 [MANUAL_SYNC_FIX] Pokemon ID ${pokemonId} not found in lookup map`);
            return null;
          }

          const trueskillRating = getRating(pokemonId);
          const trueskillData = allRatings[pokemonId];
          
          // Calculate conservative score and confidence (same as Battle mode)
          const conservativeEstimate = trueskillRating.mu - 3 * trueskillRating.sigma;
          const normalizedConfidence = Math.max(0, Math.min(100, 100 * (1 - (trueskillRating.sigma / 8.33))));

          console.log(`🔄 [MANUAL_SYNC_FIX] Converting ${pokemon.name}: score=${conservativeEstimate.toFixed(2)}, confidence=${normalizedConfidence.toFixed(1)}%, battles=${trueskillData.battleCount}`);

          // FIXED: Create a proper RankedPokemon object with all required properties
          const rankedPokemon: RankedPokemon = {
            ...pokemon, // Spread all Pokemon properties
            score: conservativeEstimate,
            count: trueskillData.battleCount || 0,
            confidence: normalizedConfidence,
            wins: 0, // Manual mode doesn't track wins/losses separately
            losses: 0,
            winRate: 0,
            rating: trueskillRating
          };

          return rankedPokemon;
        })
        .filter((pokemon): pokemon is RankedPokemon => pokemon !== null)
        .sort((a, b) => b.score - a.score); // Sort by score descending

      console.log(`🔄 [MANUAL_SYNC_FIX] ✅ Converted ${convertedRankings.length} Pokemon to Manual format`);
      console.log(`🔄 [MANUAL_SYNC_FIX] Top 3 Pokemon:`, convertedRankings.slice(0, 3).map(p => `${p.name} (${p.score.toFixed(1)})`));
      
      // Update Manual mode rankings
      setRankedPokemon(convertedRankings);
      console.log(`🔄 [MANUAL_SYNC_FIX] ✅ Manual mode rankings updated with TrueSkill data`);
    };

    // Sync immediately
    syncWithTrueSkillStore();

    // Listen for TrueSkill store updates
    const handleTrueSkillUpdate = (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_SYNC_FIX] TrueSkill store updated, re-syncing Manual mode...`);
      syncWithTrueSkillStore();
    };

    const handleTrueSkillStoreUpdate = (event: CustomEvent) => {
      console.log(`🔄 [MANUAL_SYNC_FIX] TrueSkill store direct update, re-syncing Manual mode...`);
      syncWithTrueSkillStore();
    };

    // Add event listeners
    document.addEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-updated', handleTrueSkillStoreUpdate as EventListener);
    document.addEventListener('trueskill-store-loaded', handleTrueSkillStoreUpdate as EventListener);

    // Cleanup
    return () => {
      document.removeEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-updated', handleTrueSkillStoreUpdate as EventListener);
      document.removeEventListener('trueskill-store-loaded', handleTrueSkillStoreUpdate as EventListener);
    };
  }, [getAllRatings, getRating, pokemonLookupMap, setRankedPokemon]);

  // Convert rankedPokemon to proper RankedPokemon type with defaults including new required properties
  const typedRankedPokemon: RankedPokemon[] = rankedPokemon.map(pokemon => ({
    ...pokemon,
    score: pokemon.score || 0,
    count: pokemon.count || 0,
    confidence: pokemon.confidence || 0,
    wins: pokemon.wins || 0,
    losses: pokemon.losses || 0,
    winRate: pokemon.winRate || 0
  }));

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
