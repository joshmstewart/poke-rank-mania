
import React from "react";
import PokemonList from "@/components/PokemonList";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { PaginationControls } from "./PaginationControls";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { ITEMS_PER_PAGE } from "@/services/pokemon";

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
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)] overflow-hidden">
      <PokemonList
        title="Available Pokémon (Unrated)"
        pokemonList={availablePokemon}
        droppableId="available"
      />
      
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
        <div className="text-center text-sm text-muted-foreground mt-2">
          Loaded {availablePokemon.length} Pokémon
        </div>
      )}
    </div>
  );
};
