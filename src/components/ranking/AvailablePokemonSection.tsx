
import React from "react";
import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { PaginationControls } from "./PaginationControls";
import DraggableAvailablePokemonCard from "./DraggableAvailablePokemonCard";

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
  onDragToRankings?: (pokemonId: number, insertIndex?: number) => void;
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
  getPageRange,
  onDragToRankings
}) => {
  console.log(`🔍 [AVAILABLE_SECTION] Rendering ${availablePokemon.length} available Pokemon`);
  console.log(`🔍 [AVAILABLE_SECTION] onDragToRankings available: ${!!onDragToRankings}`);

  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🔍 [AVAILABLE_SECTION] Drag started for Pokemon`, event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`🔍 [AVAILABLE_SECTION] Drag ended`, event);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🔍 [AVAILABLE_SECTION] No drop target`);
      return;
    }

    // Check if dragging to rankings area
    if (over.id === 'rankings-drop-zone' && onDragToRankings) {
      const pokemonId = parseInt(active.id.toString().replace('available-', ''));
      console.log(`🔍 [AVAILABLE_SECTION] Dragging Pokemon ${pokemonId} to rankings`);
      onDragToRankings(pokemonId);
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Available Pokémon</h2>
          <div className="text-sm">
            Gen {selectedGeneration} • {availablePokemon.length} available
          </div>
        </div>
        
        {/* Pokemon Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {availablePokemon.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">No available Pokémon</p>
                <p className="text-sm">All Pokémon have been ranked!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {availablePokemon.map((pokemon) => (
                <DraggableAvailablePokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
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
    </DndContext>
  );
};
