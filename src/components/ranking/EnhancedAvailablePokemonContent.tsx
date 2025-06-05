
import React from "react";
import { Pokemon } from "@/services/pokemon";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";
import GenerationHeader from "@/components/pokemon/GenerationHeader";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { Loader2 } from "lucide-react";

interface EnhancedAvailablePokemonContentProps {
  items: (Pokemon | { type: 'generation-header'; generationId: number; generationName: string })[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isGenerationExpanded: (genId: number) => boolean;
  onToggleGeneration: (genId: number) => void;
  isLoading: boolean;
  loadingRef: React.RefObject<HTMLDivElement>;
  currentPage: number;
  totalPages: number;
}

export const EnhancedAvailablePokemonContent: React.FC<EnhancedAvailablePokemonContentProps> = ({
  items,
  showGenerationHeaders,
  viewMode,
  isGenerationExpanded,
  onToggleGeneration,
  isLoading,
  loadingRef,
  currentPage,
  totalPages
}) => {
  console.log(`📋 [ENHANCED_AVAILABLE_CONTENT] Rendering ${items.length} items (headers: ${showGenerationHeaders})`);

  // EXPLICIT NOTE: "All Filtered" Pokémon cards intentionally NOT sortable.
  // NO SortableContext wrapper - Pokemon maintain Pokédex order.
  // Pokémon can ONLY be dragged into "Your Rankings" grid.

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className={`gap-3 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}`}>
        {items.map((item, index) => {
          if ('type' in item && item.type === 'generation-header') {
            return (
              <div key={`gen-header-${item.generationId}`} className="col-span-full">
                <GenerationHeader
                  generationId={item.generationId}
                  name={item.generationName}
                  region=""
                  games=""
                  viewMode={viewMode}
                  isExpanded={isGenerationExpanded(item.generationId)}
                  onToggle={() => onToggleGeneration(item.generationId)}
                />
              </div>
            );
          }

          const pokemon = item as Pokemon;
          
          return (
            <OptimizedDraggableCard
              key={`available-${pokemon.id}`}
              pokemon={pokemon}
              index={index}
              context="available"
              isDraggable={true}
              showRank={false}
            />
          );
        })}
      </div>

      {/* Loading indicator for pagination */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading more Pokémon...</span>
        </div>
      )}

      {/* Infinite scroll loader */}
      <InfiniteScrollLoader
        loadingRef={loadingRef}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
      />
    </div>
  );
};
