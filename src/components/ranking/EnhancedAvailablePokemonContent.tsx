
import React from "react";
import { VirtualPokemonGrid } from "./VirtualPokemonGrid";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import GenerationHeader from "@/components/pokemon/GenerationHeader";
import { Skeleton } from "@/components/ui/skeleton";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";

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
  const containerHeight = 600;

  if (showGenerationHeaders) {
    // When showing generation headers, render normally
    return (
      <div className="flex-1 overflow-y-auto p-2">
        {items.map((item, index) => {
          if (item.type === 'header') {
            return (
              <GenerationHeader
                key={`gen-${item.generationId}`}
                generationId={item.generationId}
                name={item.data?.name || `Generation ${item.generationId}`}
                region={item.data?.region || "Unknown"}
                games={item.data?.games || ""}
                viewMode={viewMode}
                isExpanded={isGenerationExpanded(item.generationId)}
                onToggle={() => onToggleGeneration(item.generationId)}
              />
            );
          }

          // Render individual Pokemon cards
          return (
            <div key={`pokemon-${item.id}-${index}`} className={viewMode === 'grid' ? 'inline-block w-1/4 p-1' : 'mb-1'}>
              <DraggablePokemonMilestoneCard
                pokemon={item}
                index={index}
                isPending={false}
                showRank={item.isRanked}
                isDraggable={true}
                isAvailable={true}
                context="available"
              />
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="grid grid-cols-4 gap-2 w-full">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          </div>
        )}

        <InfiniteScrollLoader
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          loadingRef={loadingRef}
        />
      </div>
    );
  }

  // For flat lists without headers, use simple grid rendering instead of virtual scrolling for now
  // This ensures Pokemon are actually visible while maintaining good performance
  const pokemonItems = items.filter(item => item.type !== 'header' && item.id);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-2">
            {pokemonItems.map((pokemon, index) => (
              <DraggablePokemonMilestoneCard
                key={`available-${pokemon.id}`}
                pokemon={pokemon}
                index={index}
                isPending={false}
                showRank={pokemon.isRanked}
                isDraggable={true}
                isAvailable={true}
                context="available"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {pokemonItems.map((pokemon, index) => (
              <DraggablePokemonMilestoneCard
                key={`available-${pokemon.id}`}
                pokemon={pokemon}
                index={index}
                isPending={false}
                showRank={pokemon.isRanked}
                isDraggable={true}
                isAvailable={true}
                context="available"
              />
            ))}
          </div>
        )}
      </div>
      
      {isLoading && (
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      )}

      <InfiniteScrollLoader
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        loadingRef={loadingRef}
      />
    </div>
  );
};
