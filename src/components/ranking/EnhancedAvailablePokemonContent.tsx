
import React from "react";
import { LoadingType } from "@/hooks/pokemon/types";
import { PokemonGridSection } from "@/components/pokemon/PokemonGridSection";
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
  console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Rendering ${items.length} items`);

  const renderItems = () => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No available Pokémon found</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {items.map((item, index) => {
          // Handle generation headers
          if (item.type === 'generation-header') {
            const isExpanded = isGenerationExpanded(item.generationId);
            
            return (
              <div key={`gen-header-${item.generationId}`}>
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
                
                {isExpanded && (
                  <div className="mt-4">
                    {/* This will be filled by the next Pokemon items */}
                  </div>
                )}
              </div>
            );
          }
          
          // Handle Pokemon items - render them in a grid if their generation is expanded
          if (item.id && item.name) {
            // Find the current generation for this Pokemon
            const currentGeneration = Math.ceil(item.id / 151); // Simple generation calculation
            const isCurrentGenExpanded = isGenerationExpanded(currentGeneration);
            
            if (!isCurrentGenExpanded) {
              return null; // Don't render if generation is collapsed
            }
            
            console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Rendering Pokemon: ${item.name} with ID: available-${item.id}`);
            
            return (
              <div key={`pokemon-${item.id}`} className="w-full">
                <OptimizedDraggableCard
                  pokemon={item}
                  index={index}
                  showRank={false}
                  isDraggable={true}
                  context="available"
                />
              </div>
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {renderItems()}
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
