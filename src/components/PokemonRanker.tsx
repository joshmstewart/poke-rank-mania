
import React from "react";
import { usePokemonRanker } from "@/hooks/usePokemonRanker";
import { RankedPokemon } from "@/services/pokemon";
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import { toast } from "@/hooks/use-toast";
import { PokemonRankerHeader } from "./pokemon/PokemonRankerHeader";
import { PokemonRankerContent } from "./pokemon/PokemonRankerContent";

const PokemonRanker = () => {
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

  // Convert rankedPokemon to proper RankedPokemon type with defaults
  const typedRankedPokemon: RankedPokemon[] = rankedPokemon.map(pokemon => ({
    ...pokemon,
    score: (pokemon as any).score || 0,
    count: (pokemon as any).count || 0,
    confidence: (pokemon as any).confidence || 0,
    wins: (pokemon as any).wins || 0,
    losses: (pokemon as any).losses || 0,
    winRate: (pokemon as any).winRate || 0
  }));

  // Initialize the enhanced manual reorder hook for unified TrueSkill
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    typedRankedPokemon,
    (updatedRankings: RankedPokemon[]) => {
      console.log(`🔥 [POKEMON_RANKER] Received enhanced reorder update with ${updatedRankings.length} Pokemon`);
      setRankedPokemon(updatedRankings as any);
    }
  );

  // Dummy functions for suggestions (simplified)
  const suggestRanking = () => {};
  const removeSuggestion = () => {};
  const clearAllSuggestions = () => {};

  const handleReset = () => {
    // Clear suggestion arrows explicitly on reset
    localStorage.removeItem('pokemon-active-suggestions');
    console.log("✅ Cleared pokemon-active-suggestions from localStorage");
    
    // Reset rankings
    resetRankings();
    
    // Clear suggestions
    clearAllSuggestions();
    
    console.log("✅ Rankings and suggestions fully reset");
    
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
          handleEnhancedManualReorder={handleEnhancedManualReorder}
        />
      </div>
    </div>
  );
};

export default PokemonRanker;
