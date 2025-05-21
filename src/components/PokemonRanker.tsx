
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, RefreshCw, List } from "lucide-react";
import { RankingResults } from "./ranking/RankingResults";
import { RankingUI } from "./ranking/RankingUI";
import { usePokemonRanker } from "@/hooks/usePokemonRanker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generations, RankedPokemon } from "@/services/pokemon";
import { useRankingSuggestions } from "@/hooks/battle/useRankingSuggestions";

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
  confidenceScores // ✅ Make sure this is here!
} = usePokemonRanker();


  const [showRankings, setShowRankings] = React.useState(false);
  const generationName = selectedGeneration === 0 ? "All Generations" : `Generation ${selectedGeneration}`;

  // Convert rankedPokemon to proper RankedPokemon type with defaults
  const typedRankedPokemon: RankedPokemon[] = rankedPokemon.map(pokemon => ({
    ...pokemon,
    score: 0,      // Default score
    count: 0,      // Default count
    confidence: 0  // Add the missing confidence property with default value
  }));

  // Initialize the ranking suggestions hook
  const {
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions
  } = useRankingSuggestions(typedRankedPokemon, setRankedPokemon as any);

  // REMOVED: Don't automatically clear suggestions when toggling between views
  // This was causing suggestions to disappear unexpectedly
  /*
  React.useEffect(() => {
    // Clear suggestions when component mounts
    clearAllSuggestions();
    
    // Return a cleanup function to clear suggestions when unmounting
    return () => {
      clearAllSuggestions();
    };
  }, [clearAllSuggestions]);
  */

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="text-sm font-medium whitespace-nowrap mr-1">Gen:</span>
              <Select 
                value={selectedGeneration.toString()} 
                onValueChange={handleGenerationChange}
              >
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <SelectValue placeholder="Generation" />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-[200px]">
                  {generations.map(gen => (
                    <SelectItem key={gen.id} value={gen.id.toString()}>
                      {gen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8 text-sm"
              onClick={() => {
                // No longer clearing suggestions when toggling view
                setShowRankings(!showRankings);
              }}
            >
              <List className="h-4 w-4" /> Rankings
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                resetRankings();
                // Only clear suggestions when explicitly resetting rankings
                clearAllSuggestions();
              }}
              className="flex items-center gap-1 h-8 text-sm"
              title={`Reset rankings for ${generationName}`}
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How to use Pokémon Ranking</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p>Your rankings are automatically saved as you make changes!</p>
                  <p>To suggest ranking adjustments, hover over a Pokémon in the rankings view and use the arrow controls.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {showRankings ? (
<RankingResults
  confidentRankedPokemon={typedRankedPokemon}
confidenceScores={confidenceScores}

  onSuggestRanking={suggestRanking}
  onRemoveSuggestion={removeSuggestion}
  onClearSuggestions={clearAllSuggestions}
/>

        ) : (
          <RankingUI
            isLoading={isLoading}
            availablePokemon={availablePokemon}
            rankedPokemon={rankedPokemon}
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
          />
        )}
      </div>
    </div>
  );
};

export default PokemonRanker;
