
import React, { useState, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import PokemonListControls from "@/components/pokemon/PokemonListControls";
import { PokemonGridSection } from "@/components/pokemon/PokemonGridSection";
import { usePokemonGrouping } from "@/hooks/pokemon/usePokemonGrouping";
import { useGenerationExpansion } from "@/hooks/pokemon/useGenerationExpansion";

interface AvailablePokemonSectionProps {
  availablePokemon: Pokemon[];
  isLoading: boolean;
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
}

export const AvailablePokemonSection: React.FC<AvailablePokemonSectionProps> = ({
  availablePokemon,
  isLoading,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadingRef,
  handlePageChange,
  getPageRange
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  console.log(`🔍 [AVAILABLE_SECTION] Rendering ${availablePokemon.length} available Pokemon for generation ${selectedGeneration}`);

  // Get all possible generations from the available Pokemon - improved logic
  const availableGenerations = useMemo(() => {
    const generations = new Set<number>();
    availablePokemon.forEach(pokemon => {
      let gen: number;
      let baseId = pokemon.id;
      
      // For high IDs (variants/forms), try to map to base Pokemon generation
      if (pokemon.id > 1025) {
        const mod1000 = pokemon.id % 1000;
        const mod10000 = pokemon.id % 10000;
        
        if (mod1000 >= 1 && mod1000 <= 1025) {
          baseId = mod1000;
        } else if (mod10000 >= 1 && mod10000 <= 1025) {
          baseId = mod10000;
        }
      }
      
      // Standard generation ranges
      if (baseId <= 151) gen = 1;
      else if (baseId <= 251) gen = 2;
      else if (baseId <= 386) gen = 3;
      else if (baseId <= 493) gen = 4;
      else if (baseId <= 649) gen = 5;
      else if (baseId <= 721) gen = 6;
      else if (baseId <= 809) gen = 7;
      else if (baseId <= 905) gen = 8;
      else if (baseId <= 1025) gen = 9;
      else gen = 9; // Default to latest
      
      generations.add(gen);
    });
    return Array.from(generations).sort((a, b) => a - b);
  }, [availablePokemon]);

  const { expandedGenerations, toggleGeneration, isGenerationExpanded, expandAll, collapseAll } = useGenerationExpansion();

  const { items, showGenerationHeaders } = usePokemonGrouping(
    availablePokemon,
    searchTerm,
    false, // This is not the ranking area
    isGenerationExpanded
  );

  console.log(`🔍 [AVAILABLE_SECTION] Pokemon grouping returned ${items.length} items with headers: ${showGenerationHeaders}`);
  console.log(`🔍 [AVAILABLE_SECTION] Available generations: ${availableGenerations.join(', ')}`);

  const allExpanded = expandedGenerations.size === availableGenerations.length && availableGenerations.length > 0;

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Available Pokémon</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search Pokémon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              {viewMode === "grid" ? "List" : "Grid"}
            </button>
            {availableGenerations.length > 1 && (
              <>
                <button
                  onClick={() => allExpanded ? collapseAll() : expandAll(availableGenerations)}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                >
                  {allExpanded ? "Collapse All" : "Expand All"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <PokemonGridSection
        items={items}
        showGenerationHeaders={showGenerationHeaders}
        viewMode={viewMode}
        isRankingArea={false}
        isGenerationExpanded={isGenerationExpanded}
        onToggleGeneration={toggleGeneration}
      />

      <InfiniteScrollLoader
        isLoading={isLoading}
        loadingRef={loadingRef}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
};
