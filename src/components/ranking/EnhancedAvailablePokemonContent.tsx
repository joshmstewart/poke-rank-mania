import React from "react";
import { useDroppable } from '@dnd-kit/core';
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
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
  allRankedPokemon?: any[]; // Add this prop to pass ranked Pokemon list
}

// Simple loading placeholder component
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
  allRankedPokemon = [] // Default to empty array
}) => {
  const { setNodeRef } = useDroppable({
    id: 'enhanced-available-drop-zone',
    data: {
      type: 'available-container',
      accepts: 'ranked-pokemon' // Kept for potential future use (e.g., un-ranking)
    }
  });

  // Group items by generation for display
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
        // Render previous generation's Pokemon if any
        if (currentGenerationPokemon.length > 0) {
          result.push(
            <div key={`gen-${currentGeneration}-pokemon`} className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {currentGenerationPokemon.map((pokemon, index) => (
                <DraggablePokemonMilestoneCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={index}
                  isPending={false}
                  showRank={false}
                  isDraggable={true}
                  isAvailable={true}
                  context="available"
                  allRankedPokemon={allRankedPokemon}
                />
              ))}
            </div>
          );
          currentGenerationPokemon = [];
        }

        // Add generation header with proper data
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

    // Render remaining Pokemon
    if (currentGenerationPokemon.length > 0) {
      result.push(
        <div key={`gen-${currentGeneration}-pokemon-final`} className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {currentGenerationPokemon.map((pokemon, index) => (
            <DraggablePokemonMilestoneCard
              key={pokemon.id}
              pokemon={pokemon}
              index={index}
              isPending={false}
              showRank={false}
              isDraggable={true}
              isAvailable={true}
              context="available"
              allRankedPokemon={allRankedPokemon}
            />
          ))}
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

// Helper functions for generation data
const getRegionForGeneration = (gen: number): string => {
  const regions: Record<number, string> = {
    1: "Kanto",
    2: "Johto", 
    3: "Hoenn",
    4: "Sinnoh",
    5: "Unova",
    6: "Kalos",
    7: "Alola",
    8: "Galar",
    9: "Paldea"
  };
  return regions[gen] || "Unknown";
};

const getGamesForGeneration = (gen: number): string => {
  const games: Record<number, string> = {
    1: "Red, Blue, Yellow",
    2: "Gold, Silver, Crystal",
    3: "Ruby, Sapphire, Emerald",
    4: "Diamond, Pearl, Platinum",
    5: "Black, White, B2W2",
    6: "X, Y, ORAS",
    7: "Sun, Moon, USUM",
    8: "Sword, Shield",
    9: "Scarlet, Violet"
  };
  return games[gen] || "Unknown";
};
