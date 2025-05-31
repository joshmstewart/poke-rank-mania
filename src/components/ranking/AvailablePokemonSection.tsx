
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { PaginationControls } from "./PaginationControls";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";

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
  console.log(`🔍 [AVAILABLE_SECTION] Rendering ${availablePokemon.length} available Pokemon`);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Available Pokémon</h2>
        <div className="text-sm">
          Gen {selectedGeneration} • {availablePokemon.length} available
        </div>
      </div>
      
      {/* Pokemon Grid - Using unified card component */}
      <div className="flex-1 overflow-y-auto p-4">
        {availablePokemon.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No available Pokémon</p>
              <p className="text-sm">All Pokémon have been ranked!</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {availablePokemon.map((pokemon, index) => (
              <DraggablePokemonMilestoneCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                showRank={false}
                isDraggable={true}
                isAvailable={true}
              />
            ))}
          </div>
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
