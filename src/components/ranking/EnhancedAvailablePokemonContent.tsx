
import React from "react";
import { useDroppable } from '@dnd-kit/core';
import { UnifiedPokemonCard } from "@/components/unified/UnifiedPokemonCard";
import GenerationHeader from "@/components/pokemon/GenerationHeader";

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
  allRankedPokemon?: any[];
}

const PokemonLoadingPlaceholder = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full"></div>
);

export const EnhancedAvailablePokemonContent: React.FC<EnhancedAvailablePokemonContentProps> = ({
  items,
  showGenerationHeaders,
  viewMode,
  isGenerationExpanded,
  onToggleGeneration,
  isLoading,
  loadingRef,
  currentPage,
  totalPages,
  allRankedPokemon = []
}) => {
  const { setNodeRef } = useDroppable({
    id: 'enhanced-available-drop-zone',
    data: {
      type: 'available-container',
      accepts: 'ranked-pokemon'
    }
  });

  const renderContent = () => {
    if (items.length === 0 && !isLoading) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No Pokémon available</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        </div>
      );
    }

    const result = [];
    let currentGenerationPokemon = [];
    let currentGeneration = null;

    for (const item of items) {
      if (item.type === 'header') {
        if (currentGenerationPokemon.length > 0) {
          result.push(
            <div key={`gen-${currentGeneration}-pokemon`} className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {currentGenerationPokemon.map((pokemon, index) => {
                const isRanked = allRankedPokemon.some(ranked => ranked.id === pokemon.id);
                const currentRank = isRanked ? allRankedPokemon.findIndex(ranked => ranked.id === pokemon.id) + 1 : undefined;
                
                return (
                  <UnifiedPokemonCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    index={index}
                    context="available"
                    isRanked={isRanked}
                    currentRank={currentRank}
                  />
                );
              })}
            </div>
          );
          currentGenerationPokemon = [];
        }

        result.push(
          <GenerationHeader
            key={`gen-${item.generationId}`}
            generationId={item.generationId}
            name={item.data.name}
            region={item.data.region}
            games={item.data.games}
            viewMode={viewMode}
            isExpanded={isGenerationExpanded(item.generationId)}
            onToggle={() => onToggleGeneration(item.generationId)}
          />
        );
        
        currentGeneration = item.generationId;
      } else if (item.type === 'pokemon') {
        currentGenerationPokemon.push(item.data);
      }
    }

    if (currentGenerationPokemon.length > 0) {
      result.push(
        <div key={`gen-${currentGeneration}-pokemon-final`} className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {currentGenerationPokemon.map((pokemon, index) => {
            const isRanked = allRankedPokemon.some(ranked => ranked.id === pokemon.id);
            const currentRank = isRanked ? allRankedPokemon.findIndex(ranked => ranked.id === pokemon.id) + 1 : undefined;
            
            return (
              <UnifiedPokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                context="available"
                isRanked={isRanked}
                currentRank={currentRank}
              />
            );
          })}
        </div>
      );
    }

    return result;
  };

  return (
    <div
      ref={setNodeRef}
      className="flex-1 overflow-y-visible overflow-x-visible p-4 transition-colors"
    >
      <div className="space-y-4">
        {renderContent()}
        
        {isLoading && (
          <div ref={loadingRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <PokemonLoadingPlaceholder key={`loading-${i}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
