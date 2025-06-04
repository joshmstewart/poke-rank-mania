
import React from "react";
import { LoadingType } from "@/hooks/pokemon/types";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";

interface EnhancedAvailablePokemonContentProps {
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isGenerationExpanded: (generationId: number) => boolean;
  onToggleGeneration: (generationId: number) => void;
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
  console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] ===== RENDERING START =====`);
  console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Rendering ${items.length} items`);

  if (!items || items.length === 0) {
    console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] No items to render`);
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center py-8 text-gray-500">
          <p>No available Pokémon found</p>
        </div>
        <InfiniteScrollLoader
          isLoading={isLoading}
          loadingRef={loadingRef}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    );
  }

  console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Processing ${items.length} items for rendering`);

  // Separate generation headers from pokemon items
  const pokemonItems = [];
  const generationHeaders = [];

  items.forEach((item, index) => {
    if (item.type === 'generation-header') {
      generationHeaders.push({ ...item, originalIndex: index });
    } else if (item.id && item.name) {
      // Check if this pokemon's generation is expanded
      const currentGeneration = Math.ceil(item.id / 151);
      const isCurrentGenExpanded = isGenerationExpanded(currentGeneration);
      
      if (isCurrentGenExpanded) {
        pokemonItems.push({ ...item, originalIndex: index });
      }
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Render generation headers */}
      {showGenerationHeaders && generationHeaders.map(item => {
        const isExpanded = isGenerationExpanded(item.generationId);
        
        return (
          <div key={`gen-header-${item.generationId}`} className="mb-4">
            <div 
              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onToggleGeneration(item.generationId)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">
                  {isExpanded ? '▼' : '▶'}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.generationName}</h3>
                  <p className="text-sm text-gray-500">{item.region} • {item.games}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Render Pokemon in proper grid layout - SAME AS YOUR RANKINGS */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {pokemonItems.map((item) => {
          console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] ===== RENDERING OPTIMIZED DRAGGABLE CARD =====`);
          console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Pokemon: ${item.name} with ID: ${item.id}`);
          
          return (
            <OptimizedDraggableCard
              key={`pokemon-${item.id}`}
              pokemon={item}
              index={item.originalIndex}
              showRank={false}
              isDraggable={true}
              context="available"
            />
          );
        })}
      </div>
      
      <InfiniteScrollLoader
        isLoading={isLoading}
        loadingRef={loadingRef}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
};
