
import React from "react";
import { LoadingType } from "@/hooks/pokemon/types";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";
import GenerationHeader from "@/components/pokemon/GenerationHeader";
import { LoadingState } from "./LoadingState";
import { AvailablePokemonDroppableContainer } from "./AvailablePokemonDroppableContainer";

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

export const EnhancedAvailablePokemonContent: React.FC<EnhancedAvailablePokemonContentProps> = (props) => {
  const {
    items,
    showGenerationHeaders,
    viewMode,
    isGenerationExpanded,
    onToggleGeneration,
    isLoading,
    loadingRef,
    currentPage,
    totalPages
  } = props;

  // CRITICAL: Explicit component rendering confirmation
  console.log('🚨 EnhancedAvailablePokemonContent COMPONENT RENDERED', {
    itemsCount: items.length,
    showGenerationHeaders,
    viewMode,
    isLoading,
    currentPage,
    totalPages,
    props: props
  });

  console.log(`🔍🔍🔍 [ENHANCED_CONTENT_RENDER] ===== ENHANCED AVAILABLE CONTENT RENDERING =====`);
  console.log(`🔍🔍🔍 [ENHANCED_CONTENT_RENDER] Rendering ${items.length} items`);
  console.log(`🔍🔍🔍 [ENHANCED_CONTENT_RENDER] First few items:`, items.slice(0, 3));

  // Count different item types
  const pokemonItems = items.filter(item => item.id && !item.type);
  const headerItems = items.filter(item => item.type === 'generation-header');
  
  console.log(`🔍🔍🔍 [ENHANCED_CONTENT_RENDER] Pokemon items count: ${pokemonItems.length}`);
  console.log(`🔍🔍🔍 [ENHANCED_CONTENT_RENDER] Header items count: ${headerItems.length}`);

  return (
    <AvailablePokemonDroppableContainer>
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
              console.log(`🔍🔍🔍 [ENHANCED_CONTENT_ITEM] Processing item ${index}:`, {
                hasId: !!item.id,
                hasType: !!item.type,
                type: item.type,
                name: item.name,
                isGenHeader: item.type === 'generation-header'
              });

              // Handle generation headers
              if (item.type === 'generation-header') {
                console.log(`🔍🔍🔍 [ENHANCED_CONTENT_HEADER] Rendering generation header for gen ${item.generationId}`);
                return showGenerationHeaders ? (
                  <div key={`gen-${item.generationId}`} className="col-span-full">
                    <GenerationHeader
                      generationId={item.generationId}
                      name={item.generationName}
                      region={item.region}
                      games={item.games}
                      viewMode={viewMode}
                      isExpanded={isGenerationExpanded(item.generationId)}
                      onToggle={() => onToggleGeneration(item.generationId)}
                    />
                  </div>
                ) : null;
              }

              // Handle Pokémon items - CRITICAL FIX: Always use 'available' context
              if (item.id) {
                console.log(`🟢🟢🟢 [AVAILABLE_RENDER] ===== RENDERING AVAILABLE POKEMON =====`);
                console.log(`🟢🟢🟢 [AVAILABLE_RENDER] Pokemon: ${item.name} (ID: ${item.id})`);
                console.log(`🟢🟢🟢 [AVAILABLE_RENDER] Context: 'available'`);
                console.log(`🟢🟢🟢 [AVAILABLE_RENDER] Index: ${index}`);
                console.log(`🟢🟢🟢 [AVAILABLE_RENDER] About to render OptimizedDraggableCard with context='available'`);
                
                // CRITICAL: Explicit rendering confirmation before component
                console.log(`🚨 ABOUT TO RENDER OptimizedDraggableCard for ${item.name} with context="available"`);
                
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

              console.log(`⚠️⚠️⚠️ [ENHANCED_CONTENT_UNKNOWN] Unknown item type at index ${index}:`, item);
              return null;
            })}
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <LoadingState 
            selectedGeneration={0}
            loadSize={20}
            itemsPerPage={20}
            loadingType="pagination"
          />
        )}
      </div>
    </AvailablePokemonDroppableContainer>
  );
};
