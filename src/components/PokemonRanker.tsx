
import React, { useEffect } from "react";
import { usePokemonRanker } from "@/hooks/usePokemonRanker";
import { RankedPokemon } from "@/services/pokemon";
import { useRankingSuggestions } from "@/hooks/battle/useRankingSuggestions";
import { useRankings } from "@/hooks/battle/useRankings";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { toast } from "@/hooks/use-toast";
import { PokemonRankerHeader } from "./pokemon/PokemonRankerHeader";
import { PokemonRankerContent } from "./pokemon/PokemonRankerContent";
import { Button } from "@/components/ui/button";

const PokemonRanker = () => {
  console.log(`🔄 [MANUAL_MODE_FIXED] ===== PokemonRanker Component Render =====`);
  
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

  // CRITICAL FIX: Use Battle Mode ranking system for TrueSkill-based rankings
  const {
    finalRankings: battleModeRankings,
    confidenceScores: battleConfidenceScores,
    generateRankings,
    handleSaveRankings,
    activeTier,
    setActiveTier,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions
  } = useRankings();

  // Get TrueSkill store functions
  const { clearAllRatings, getAllRatings, getRating } = useTrueSkillStore();
  const { pokemonLookupMap, allPokemon } = usePokemonContext();

  // FIXED: Sync TrueSkill data through the Battle Mode ranking system
  const syncWithBattleModeRankings = React.useCallback(async () => {
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] ===== BATTLE MODE SYNC ENTRY =====`);
    
    // Check context readiness
    if (pokemonLookupMap.size === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Context not ready - deferring sync`);
      return;
    }

    const allRatings = getAllRatings();
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] TrueSkill ratings: ${ratedPokemonIds.length}`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Context Pokemon: ${pokemonLookupMap.size}`);
    
    if (ratedPokemonIds.length === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] No TrueSkill ratings - clearing rankings`);
      return;
    }

    // Generate rankings using the Battle Mode system with empty battle results
    // This will pull TrueSkill data from the centralized store
    const emptyBattleResults: any[] = [];
    const rankings = generateRankings(emptyBattleResults);
    
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Generated ${rankings.length} rankings from Battle Mode system`);
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] ===== SYNC COMPLETE =====`);
  }, [getAllRatings, pokemonLookupMap.size, generateRankings]);

  // Sync when context and TrueSkill data are ready
  useEffect(() => {
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Effect triggered - context: ${pokemonLookupMap.size}, ratings: ${Object.keys(getAllRatings()).length}`);
    
    const ratings = getAllRatings();
    const ratingsCount = Object.keys(ratings).length;
    
    if (pokemonLookupMap.size > 0 && ratingsCount > 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Both ready - triggering Battle Mode sync`);
      syncWithBattleModeRankings();
    } else if (pokemonLookupMap.size > 0 && ratingsCount === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Context ready but no ratings`);
    }
  }, [pokemonLookupMap.size, getAllRatings, syncWithBattleModeRankings]);

  // Listen for TrueSkill events and trigger Battle Mode sync
  useEffect(() => {
    const handleTrueSkillUpdate = async (event: CustomEvent) => {
      console.log(`🔥🔥🔥 [MANUAL_EVENT_FIXED] TrueSkill event: ${event.type}`);
      
      setTimeout(async () => {
        const ratings = getAllRatings();
        console.log(`🔥🔥🔥 [MANUAL_EVENT_FIXED] Ratings after event: ${Object.keys(ratings).length}`);
        
        if (pokemonLookupMap.size > 0 && Object.keys(ratings).length > 0) {
          console.log(`🔥🔥🔥 [MANUAL_EVENT_FIXED] Triggering Battle Mode sync after event`);
          await syncWithBattleModeRankings();
        }
      }, 150);
    };

    const handleTrueSkillCleared = () => {
      console.log(`🔥🔥🔥 [MANUAL_EVENT_FIXED] TrueSkill cleared - resetting Battle Mode rankings`);
      // The Battle Mode system will handle clearing its own state
    };

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
  }, [syncWithBattleModeRankings, getAllRatings, pokemonLookupMap.size]);

  // Manual sync trigger for debugging
  const handleManualSync = () => {
    console.log(`🔥🔥🔥 [MANUAL_TRIGGER_FIXED] Manual sync triggered`);
    console.log(`🔥🔥🔥 [MANUAL_TRIGGER_FIXED] Context: ${pokemonLookupMap.size}, Ratings: ${Object.keys(getAllRatings()).length}`);
    console.log(`🔥🔥🔥 [MANUAL_TRIGGER_FIXED] Battle Mode rankings: ${battleModeRankings.length}`);
    
    syncWithBattleModeRankings();
  };

  // Convert manual rankedPokemon to proper type (for fallback only)
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

  const handleReset = () => {
    console.log("🔄 [MANUAL_RESET_FIXED] Starting complete reset");
    
    localStorage.removeItem('pokemon-active-suggestions');
    clearAllRatings();
    resetRankings();
    clearAllSuggestions();
    
    toast({
      title: "Rankings Reset",
      description: "All rankings and suggestions have been cleared.",
      duration: 3000
    });
    
    setResetDialogOpen(false);
  };

  const handleToggleRankings = () => {
    console.log(`🔥🔥🔥 [MANUAL_TOGGLE_FIXED] Toggling to ${!showRankings}`);
    console.log(`🔥🔥🔥 [MANUAL_TOGGLE_FIXED] Battle Mode rankings: ${battleModeRankings.length}`);
    console.log(`🔥🔥🔥 [MANUAL_TOGGLE_FIXED] Manual rankings: ${rankedPokemon.length}`);
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

        <div className="flex flex-col items-center gap-2">
          <Button 
            onClick={handleManualSync}
            variant="outline"
            className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
          >
            🔍 Debug: Manual Sync
          </Button>
          <div className="text-xs text-gray-600 text-center">
            Context: {pokemonLookupMap.size} | Ratings: {Object.keys(getAllRatings()).length} | 
            Battle Rankings: {battleModeRankings.length} | Manual: {rankedPokemon.length}
          </div>
        </div>

        <PokemonRankerContent
          showRankings={showRankings}
          isLoading={isLoading}
          availablePokemon={availablePokemon}
          rankedPokemon={rankedPokemon}
          typedRankedPokemon={showRankings ? battleModeRankings : typedRankedPokemon}
          confidenceScores={showRankings ? battleConfidenceScores : confidenceScores}
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
