
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

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-6">
        {items.map((item, index) => {
          console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Processing item ${index}:`, {
            hasType: 'type' in item,
            type: item.type,
            hasId: 'id' in item,
            id: item.id,
            hasName: 'name' in item,
            name: item.name
          });

          // Handle generation headers
          if (item.type === 'generation-header') {
            const isExpanded = isGenerationExpanded(item.generationId);
            console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Rendering generation header: ${item.generationName} (expanded: ${isExpanded})`);
            
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
                  <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                    {/* Pokemon cards for this generation will be rendered separately */}
                  </div>
                )}
              </div>
            );
          }
          
          // Handle Pokemon items - render them if they have id and name
          if (item.id && item.name) {
            // Find the current generation for this Pokemon
            const currentGeneration = Math.ceil(item.id / 151); // Simple generation calculation
            const isCurrentGenExpanded = isGenerationExpanded(currentGeneration);
            
            console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Pokemon ${item.name} (ID: ${item.id}) - Generation ${currentGeneration} expanded: ${isCurrentGenExpanded}`);
            
            if (!isCurrentGenExpanded) {
              console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Skipping ${item.name} - generation ${currentGeneration} is collapsed`);
              return null; // Don't render if generation is collapsed
            }
            
            console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] ===== RENDERING OPTIMIZED DRAGGABLE CARD =====`);
            console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Pokemon: ${item.name} with ID: ${item.id}`);
            console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Expected draggable ID: available-${item.id}`);
            console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Context: available`);
            console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] isDraggable: true`);
            
            return (
              <OptimizedDraggableCard
                key={`pokemon-${item.id}`}
                pokemon={item}
                index={index}
                showRank={false}
                isDraggable={true}
                context="available"
              />
            );
          }
          
          console.log(`🔍 [ENHANCED_AVAILABLE_CONTENT] Item ${index} does not match any render condition - skipping`);
          return null;
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
