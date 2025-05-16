
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, RefreshCw, List } from "lucide-react";
import { RankingResults } from "./ranking/RankingResults";
import { RankingUI } from "./ranking/RankingUI";
import { usePokemonRanker } from "@/hooks/usePokemonRanker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generations } from "@/services/pokemon";

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
    getPageRange
  } = usePokemonRanker();

  const [showRankings, setShowRankings] = React.useState(false);
  const generationName = selectedGeneration === 0 ? "All Generations" : `Generation ${selectedGeneration}`;

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        {/* Controls bar - similar to BattleControls */}
        <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow border">
          {/* Left side - Gen dropdown only */}
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
          
          {/* Right side - action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8 text-sm"
              onClick={() => setShowRankings(!showRankings)}
            >
              <List className="h-4 w-4" /> Rankings
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8 text-sm"
              onClick={resetRankings}
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
                  <p>Drag Pokémon from the left panel to your ranking list on the right.</p>
                  <p>Rearrange them in your preferred order from favorite (top) to least favorite (bottom).</p>
                  <p>Use the search box to find specific Pokémon quickly.</p>
                  <p>You can choose to rank Pokémon within a specific generation or across all generations.</p>
                  <p>Your rankings are automatically saved as you make changes!</p>
                  <p>Scroll down to load more Pokémon automatically.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Main content */}
        {showRankings ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Your Rankings</h2>
              <div className="h-1 w-full bg-gray-200 rounded-full mt-2"></div>
            </div>
            <RankingResults rankedPokemon={rankedPokemon} />
          </div>
        ) : (
          <RankingUI
            isLoading={isLoading}
            availablePokemon={availablePokemon}
            rankedPokemon={rankedPokemon}
            selectedGeneration={selectedGeneration}
            loadingType="infinite"
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
