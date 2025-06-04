
import React from "react";
import { LoadingType } from "@/hooks/pokemon/types";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";
import { GenerationHeader } from "@/components/pokemon/GenerationHeader";
import { LoadingState } from "./LoadingState";

interface EnhancedAvailablePokemonContentProps {
  items: any[];
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
  console.log(`🔍 [ENHANCED_CONTENT] Rendering ${items.length} items`);
  console.log(`🔍 [ENHANCED_CONTENT] First few items:`, items.slice(0, 3));

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p>No Pokémon available</p>
        </div>
      ) : (
        <div 
          className={`gap-2 ${
            viewMode === "grid" 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" 
              : "flex flex-col space-y-2"
          }`}
        >
          {items.map((item, index) => {
            // Handle generation headers
            if (item.type === 'generation-header') {
              return showGenerationHeaders ? (
                <div key={`gen-${item.generationId}`} className="col-span-full">
                  <GenerationHeader
                    generationId={item.generationId}
                    generationName={item.generationName}
                    region={item.region}
                    games={item.games}
                    isExpanded={isGenerationExpanded(item.generationId)}
                    onToggle={() => onToggleGeneration(item.generationId)}
                  />
                </div>
              ) : null;
            }

            // Handle Pokémon items - CRITICAL FIX: Always use 'available' context
            if (item.id) {
              console.log(`🟢🟢🟢 [AVAILABLE_RENDER] Rendering Available Pokemon: ${item.name} with context='available'`);
              return (
                <OptimizedDraggableCard
                  key={`available-${item.id}`}
                  pokemon={item}
                  index={index}
                  isPending={false}
                  showRank={false}
                  isDraggable={true}
                  context="available"
                />
              );
            }

            return null;
          })}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <LoadingState 
          loadingRef={loadingRef}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}
    </div>
  );
};
