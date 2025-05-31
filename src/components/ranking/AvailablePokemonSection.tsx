
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { PaginationControls } from "./PaginationControls";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import {
  DndContext,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import DraggablePokemonCard from "@/components/battle/DraggablePokemonCard";

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
  console.log(`🔍 [AVAILABLE_SECTION] Rendering with ${availablePokemon.length} Pokemon`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log(`🔍 [AVAILABLE_SECTION] Drag ended:`, { activeId: active.id, overId: over?.id });
    
    if (!over) return;
    
    // Handle drag to rankings area if over target supports it
    const pokemonId = Number(active.id);
    if (onDragToRankings && over.id === 'rankings-drop-zone') {
      console.log(`🔍 [AVAILABLE_SECTION] Dragging Pokemon ${pokemonId} to rankings`);
      onDragToRankings(pokemonId);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🔍 [AVAILABLE_SECTION] Drag started for Pokemon ${event.active.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-3 flex items-center justify-between">
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
              <p className="text-lg mb-2">No Pokémon available</p>
              <p className="text-sm">All Pokémon from this generation have been ranked!</p>
            </div>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {availablePokemon.map((pokemon, index) => (
                <DraggablePokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={index}
                  isPending={false}
                  showRank={false}
                />
              ))}
            </div>
          </DndContext>
        )}
        
        {/* Loading and Pagination */}
        <InfiniteScrollLoader
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          loadingRef={loadingRef}
        />
        
        {loadingType === "pagination" && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageRange={getPageRange()}
            onPageChange={handlePageChange}
            itemsPerPage={50}
          />
        )}
      </div>
    </div>
  );
};
