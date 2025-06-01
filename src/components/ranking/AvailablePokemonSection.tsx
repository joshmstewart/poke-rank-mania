
import React, { useState, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { PaginationControls } from "./PaginationControls";
import PokemonListControls from "@/components/pokemon/PokemonListControls";
import { PokemonListContent } from "@/components/pokemon/PokemonListContent";
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

  console.log(`🔍 [AVAILABLE_SECTION] Rendering ${availablePokemon.length} available Pokemon`);

  // Get all possible generations from the available Pokemon
  const availableGenerations = useMemo(() => {
    const generations = new Set<number>();
    availablePokemon.forEach(pokemon => {
      const gen = Math.floor((pokemon.id - 1) / 151) + 1; // Simple generation calculation
      if (gen >= 1 && gen <= 9) {
        generations.add(gen);
      }
    });
    return Array.from(generations).sort();
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

  return (
    <div className="flex flex-col h-full">
      {/* Header with Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Available Pokémon</h2>
          <div className="text-sm text-gray-500 font-medium">
            Gen {selectedGeneration} • {availablePokemon.length} available
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
          <PokemonListContent
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
