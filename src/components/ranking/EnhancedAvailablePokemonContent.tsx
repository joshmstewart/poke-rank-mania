
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
  console.log('🚨🚨🚨 [ENHANCED_CONTENT_DIAGNOSTIC] ===== ENHANCED AVAILABLE CONTENT COMPONENT ENTRY =====');
  console.log('🚨🚨🚨 [ENHANCED_CONTENT_DIAGNOSTIC] This is EnhancedAvailablePokemonContent.tsx rendering');
  console.log(`🚨🚨🚨 [ENHANCED_CONTENT_DIAGNOSTIC] Rendering ${items.length} items`);

  // Count different item types
  const pokemonItems = items.filter(item => item.id && !item.type);
  const headerItems = items.filter(item => item.type === 'generation-header');
  
  console.log(`🚨🚨🚨 [ENHANCED_CONTENT_DIAGNOSTIC] Pokemon items count: ${pokemonItems.length}`);
  console.log(`🚨🚨🚨 [ENHANCED_CONTENT_DIAGNOSTIC] Header items count: ${headerItems.length}`);

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
              console.log(`🚨🚨🚨 [ENHANCED_CONTENT_ITEM_DIAGNOSTIC] Processing item ${index}:`, {
                hasId: !!item.id,
                hasType: !!item.type,
                type: item.type,
                name: item.name,
                isGenHeader: item.type === 'generation-header'
              });

              // Handle generation headers
              if (item.type === 'generation-header') {
                console.log(`🚨🚨🚨 [ENHANCED_CONTENT_HEADER_DIAGNOSTIC] Rendering generation header for gen ${item.generationId}`);
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

              // Handle Pokémon items - CRITICAL: Ensure we're using OptimizedDraggableCard
              if (item.id) {
                console.log(`🔥🔥🔥 [CRITICAL_AVAILABLE_POKEMON_FIX] ===== RENDERING AVAILABLE POKEMON =====`);
                console.log(`🔥🔥🔥 [CRITICAL_AVAILABLE_POKEMON_FIX] Pokemon: ${item.name} (ID: ${item.id})`);
                console.log(`🔥🔥🔥 [CRITICAL_AVAILABLE_POKEMON_FIX] Using component: OptimizedDraggableCard`);
                console.log(`🔥🔥🔥 [CRITICAL_AVAILABLE_POKEMON_FIX] Context: 'available'`);
                console.log(`🔥🔥🔥 [CRITICAL_AVAILABLE_POKEMON_FIX] Key: available-${item.id}`);
                console.log(`🔥🔥🔥 [CRITICAL_AVAILABLE_POKEMON_FIX] Index: ${index}`);
                console.log(`🔥🔥🔥 [CRITICAL_AVAILABLE_POKEMON_FIX] This should initialize with useDraggable hook`);
                
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

              console.log(`⚠️⚠️⚠️ [ENHANCED_CONTENT_UNKNOWN_DIAGNOSTIC] Unknown item type at index ${index}:`, item);
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
