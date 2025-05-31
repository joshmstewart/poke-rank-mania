
import React from "react";
import PokemonList from "@/components/PokemonList";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { PaginationControls } from "./PaginationControls";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { ITEMS_PER_PAGE } from "@/services/pokemon";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AvailablePokemonSectionProps {
  availablePokemon: any[];
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
  return (
    <>
      {/* Header with gradient background - reduced padding */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 border-b flex-shrink-0">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
          Available Pokémon ({availablePokemon.length})
        </h2>
        <p className="text-blue-100 text-xs mt-1">Unrated • Ready to rank</p>
      </div>

      {/* Content area with proper scrolling - reduced padding */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="bg-gray-50 min-h-full p-2">
            <PokemonList
              title=""
              pokemonList={availablePokemon}
              droppableId="available"
            />
          </div>
        </ScrollArea>
      </div>
      
      {/* Footer controls - reduced padding */}
      <div className="border-t bg-white p-2 flex-shrink-0">
        {/* Infinite scroll loading indicator */}
        {loadingType === "infinite" && (
          <InfiniteScrollLoader
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            loadingRef={loadingRef}
          />
        )}
        
        {/* Pagination controls */}
        {selectedGeneration === 0 && loadingType === "pagination" && totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageRange={getPageRange()}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
        
        {/* Single load info */}
        {loadingType === "single" && (
          <div className="text-center text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
            Loaded {availablePokemon.length} Pokémon
          </div>
        )}
      </div>
    </>
  );
};
