
import React from "react";
import GenerationHeader from "./GenerationHeader";
import DraggablePokemonCard from "./DraggablePokemonCard";
import PokemonCard from "@/components/PokemonCard";

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
  console.log(`[POKEMON_GRID] Rendering ${items.length} items (isRankingArea: ${isRankingArea})`);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
      {items.map((item, index) => {
        // Handle generation headers
        if ('type' in item && item.type === 'generation-header') {
          return (
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
          );
        }
        
        // Handle Pokemon items
        const pokemon = item;
        
        // For available Pokemon (not ranking area), use draggable cards
        if (!isRankingArea) {
          return (
            <div key={`available-${pokemon.id}`} style={{ minWidth: '140px' }}>
              <DraggablePokemonCard
                pokemon={pokemon}
                compact={true}
                viewMode={viewMode}
              />
            </div>
          );
        }
        
        // For ranking area, use regular cards (droppable will be handled at a higher level)
        return (
          <div key={`ranking-${pokemon.id}`} style={{ minWidth: '140px' }}>
            <PokemonCard
              pokemon={pokemon}
              compact={true}
              viewMode={viewMode}
              isDragging={false}
            />
          </div>
        );
      })}
    </div>
  );
};
