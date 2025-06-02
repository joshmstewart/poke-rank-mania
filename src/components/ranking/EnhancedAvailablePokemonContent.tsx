
import React from "react";
import { useDroppable } from '@dnd-kit/core';
import { EnhancedAvailablePokemonCard } from "./EnhancedAvailablePokemonCard";
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
  totalPages
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'enhanced-available-drop-zone',
    data: {
      type: 'available-container',
      accepts: 'ranked-pokemon'
    }
  });

  console.log(`🎴 [ENHANCED_CONTENT] Rendering ${items.length} items`);

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto p-4 transition-colors ${
        isOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''
      }`}
    >
      {items.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No Pokémon available</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        </div>
      ) : (
        <div>
          {items.map((item, index) => {
            if (item.type === 'header') {
              // Generate proper generation data
              const generationData = {
                id: item.generation,
                name: `Generation ${item.generation}`,
                region: getRegionForGeneration(item.generation),
                games: getGamesForGeneration(item.generation)
              };
              
              return (
                <GenerationHeader
                  key={`gen-${item.generation}`}
                  generationId={item.generation}
                  name={generationData.name}
                  region={generationData.region}
                  games={generationData.games}
                  viewMode={viewMode}
                  isExpanded={isGenerationExpanded(item.generation)}
                  onToggle={() => onToggleGeneration(item.generation)}
                />
              );
            }
            
            return (
              <div 
                key={`pokemon-${item.id}`} 
                className={`
                  ${viewMode === 'grid' ? 'inline-block w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 p-1' : 'mb-2'}
                `}
              >
                <EnhancedAvailablePokemonCard pokemon={item} />
              </div>
            );
          })}
          
          {isLoading && (
            <div ref={loadingRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PokemonLoadingPlaceholder key={`loading-${i}`} />
              ))}
            </div>
          )}
        </div>
      )}
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
