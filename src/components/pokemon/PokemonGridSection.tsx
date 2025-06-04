
import React from "react";
import { GenerationHeader } from "./GenerationHeader";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";

interface PokemonGridSectionProps {
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isRankingArea: boolean;
  isGenerationExpanded: (genId: number) => boolean;
  onToggleGeneration: (genId: number) => void;
}

export const PokemonGridSection: React.FC<PokemonGridSectionProps> = ({
  items,
  showGenerationHeaders,
  viewMode,
  isRankingArea,
  isGenerationExpanded,
  onToggleGeneration
}) => {
  console.log(`🎯 [POKEMON_GRID_SECTION] Rendering ${items.length} items`);
  console.log(`🎯 [POKEMON_GRID_SECTION] Is ranking area: ${isRankingArea}`);
  console.log(`🎯 [POKEMON_GRID_SECTION] Show generation headers: ${showGenerationHeaders}`);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {items.map((item, index) => {
        // Handle generation headers
        if ('type' in item && item.type === 'generation-header') {
          console.log(`🎯 [POKEMON_GRID_SECTION] Rendering generation header: ${item.generationName}`);
          return (
            <div key={`gen-${item.generationId}`} className="col-span-full">
              <GenerationHeader
                generation={{
                  id: item.generationId,
                  name: item.generationName,
                  region: item.region,
                  games: item.games
                }}
                isExpanded={isGenerationExpanded(item.generationId)}
                onToggle={() => onToggleGeneration(item.generationId)}
              />
            </div>
          );
        }
        
        // Handle Pokemon items - EXPLICITLY use OptimizedDraggableCard
        const pokemon = item;
        console.log(`🎯 [POKEMON_GRID_SECTION] Rendering OptimizedDraggableCard for ${isRankingArea ? 'ranking' : 'available'} Pokemon: ${pokemon.id} - ${pokemon.name}`);
        
        return (
          <OptimizedDraggableCard
            key={`${isRankingArea ? 'ranking' : 'available'}-${pokemon.id}`}
            pokemon={pokemon}
            index={index}
            isPending={false}
            showRank={isRankingArea}
            isDraggable={true}
            context={isRankingArea ? 'ranked' : 'available'}
          />
        );
      })}
    </div>
  );
};
