
import React, { useState } from "react";
import { usePokemonRanker } from "@/hooks/usePokemonRanker";
import { RankedPokemon } from "@/services/pokemon";
import { useRankings } from "@/hooks/battle/useRankings";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { toast } from "@/hooks/use-toast";
import { PokemonRankerHeader } from "./pokemon/PokemonRankerHeader";
import { PokemonRankerContent } from "./pokemon/PokemonRankerContent";
import { PokemonRankerDebugControls } from "./pokemon/PokemonRankerDebugControls";
import { useTrueSkillSync } from "@/hooks/pokemon/useTrueSkillSync";
import { useTrueSkillEventListeners } from "@/hooks/pokemon/useTrueSkillEventListeners";

const PokemonRanker = () => {
  console.log(`🔄 [MANUAL_MODE_FIXED] ===== PokemonRanker Component Render =====`);
  
  const [showRankings, setShowRankings] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

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

  const {
    finalRankings: battleModeRankings,
    confidenceScores: battleConfidenceScores,
    handleSaveRankings,
    activeTier,
    setActiveTier,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions
  } = useRankings();

  const { clearAllRatings } = useTrueSkillStore();
  const { syncWithBattleModeRankings, handleManualSync } = useTrueSkillSync();

  // Set up event listeners
  useTrueSkillEventListeners({ syncWithBattleModeRankings });

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

        <PokemonRankerDebugControls onManualSync={handleManualSync} />

        <PokemonRankerContent
          showRankings={showRankings}
          isLoading={isLoading}
          availablePokemon={availablePokemon}
          rankedPokemon={rankedPokemon}
          typedRankedPokemon={battleModeRankings}
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
