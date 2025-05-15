
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { ITEMS_PER_PAGE } from "@/services/pokemon";
import { RankingControls } from "./ranking/RankingControls";
import { RankingResults } from "./ranking/RankingResults";
import { RankingUI } from "./ranking/RankingUI";
import { usePokemonRanker } from "@/hooks/usePokemonRanker";

// Load options for the number of Pokémon to show
const loadSizeOptions = [50, 100, 200, 500, 1000];

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
    handleLoadingTypeChange,
    handleLoadSizeChange,
    getPageRange
  } = usePokemonRanker();

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manual Ranking</h1>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-5 w-5" />
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
                  <p>Choose your preferred loading method:
                    <ul className="list-disc list-inside mt-2 ml-4">
                      <li><strong>Pagination:</strong> Navigate through pages of Pokémon</li>
                      <li><strong>Infinite Scroll:</strong> Load more as you scroll down</li>
                      <li><strong>Single Load:</strong> Load a larger batch at once</li>
                    </ul>
                  </p>
                  <p>Your rankings are automatically saved as you make changes!</p>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={resetRankings} variant="outline">Reset Rankings</Button>
          </div>
        </div>

        <RankingControls
          selectedGeneration={selectedGeneration}
          loadingType={loadingType}
          loadSize={loadSize}
          onGenerationChange={handleGenerationChange}
          onLoadingTypeChange={handleLoadingTypeChange}
          onLoadSizeChange={handleLoadSizeChange}
          loadSizeOptions={loadSizeOptions}
        />

        <Tabs defaultValue="rank" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="rank">Rank Pokémon</TabsTrigger>
            <TabsTrigger value="results">View Rankings</TabsTrigger>
          </TabsList>
          <TabsContent value="rank" className="mt-4">
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
          </TabsContent>
          <TabsContent value="results" className="mt-4">
            <RankingResults rankedPokemon={rankedPokemon} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PokemonRanker;
