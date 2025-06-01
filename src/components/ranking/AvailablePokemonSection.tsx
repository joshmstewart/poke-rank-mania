
import React, { useState, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { PaginationControls } from "./PaginationControls";
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

  // Get all possible generations from the available Pokemon
  const availableGenerations = useMemo(() => {
    const generations = new Set<number>();
    availablePokemon.forEach(pokemon => {
      // Use a more accurate generation calculation
      let gen: number;
      if (pokemon.id <= 151) gen = 1;
      else if (pokemon.id <= 251) gen = 2;
      else if (pokemon.id <= 386) gen = 3;
      else if (pokemon.id <= 493) gen = 4;
      else if (pokemon.id <= 649) gen = 5;
      else if (pokemon.id <= 721) gen = 6;
      else if (pokemon.id <= 809) gen = 7;
      else if (pokemon.id <= 905) gen = 8;
      else gen = 9;
      
      if (gen >= 1 && gen <= 9) {
        generations.add(gen);
      }
    });
    const genArray = Array.from(generations).sort();
    console.log(`🔍 [AVAILABLE_SECTION] Available generations:`, genArray);
    return genArray;
  }, [availablePokemon]);

  // Generation expansion controls
  const {
    isGenerationExpanded,
    toggleGeneration,
    expandAll,
    collapseAll,
    allExpanded,
    allCollapsed
  } = useGenerationExpansion(availableGenerations);

  // Group Pokemon by generation with search and expansion
  const { items: groupedItems, showGenerationHeaders } = usePokemonGrouping(
    availablePokemon,
    searchTerm,
    false, // not ranking area
    isGenerationExpanded
  );

  // Calculate the correct generation to display
  const displayGeneration = selectedGeneration || (availableGenerations.length > 0 ? availableGenerations[0] : 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Available Pokémon</h2>
          <div className="text-sm text-gray-500 font-medium">
            Gen {displayGeneration} • {availablePokemon.length} available
          </div>
        </div>
        
        <PokemonListControls
          title=""
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showCollapseAll={showGenerationHeaders}
          allExpanded={allExpanded}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          hideSearch={false}
        />
      </div>
      
      {/* Pokemon Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {availablePokemon.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No available Pokémon</p>
              <p className="text-sm">All Pokémon have been ranked!</p>
            </div>
          </div>
        ) : (
          <PokemonGridSection
            items={groupedItems}
            showGenerationHeaders={showGenerationHeaders}
            viewMode={viewMode}
            isRankingArea={false}
            isGenerationExpanded={isGenerationExpanded}
            onToggleGeneration={toggleGeneration}
          />
        )}
        
        {/* Loading indicator */}
        <div ref={loadingRef}>
          <InfiniteScrollLoader 
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            loadingRef={loadingRef}
          />
        </div>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="border-t bg-gray-50 p-3">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageRange={getPageRange()}
            onPageChange={handlePageChange}
            itemsPerPage={50}
          />
        </div>
      )}
    </div>
  );
};
