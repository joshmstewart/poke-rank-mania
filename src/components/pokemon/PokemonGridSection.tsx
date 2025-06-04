
import React from "react";
import GenerationHeader from "./GenerationHeader";
import PokemonCard from "@/components/PokemonCard";
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
  // CRITICAL DIAGNOSTIC: Identify which component is being used
  console.log(`🔍🔍🔍 [POKEMON_GRID_SECTION] ===== PokemonGridSection RENDERING =====`);
  console.log(`🔍🔍🔍 [POKEMON_GRID_SECTION] isRankingArea: ${isRankingArea}`);
  console.log(`🔍🔍🔍 [POKEMON_GRID_SECTION] Items count: ${items.length}`);
  console.log(`🔍🔍🔍 [POKEMON_GRID_SECTION] This component uses PokemonCard (LEGACY)`);

  return (
    <div 
      className={`gap-2 ${
        viewMode === "grid" 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" 
          : "flex flex-col space-y-2"
      }`}
    >
      {items.map((item, index) => {
        // Handle generation headers
        if (item.type === 'generation-header' || (item.generationId && showGenerationHeaders)) {
          const genId = item.generationId || item.generation;
          return showGenerationHeaders ? (
            <div key={`gen-${genId}`} className="col-span-full">
              <GenerationHeader
                generationId={genId}
                name={item.generationName || item.name}
                region={item.region}
                games={item.games}
                viewMode={viewMode}
                isExpanded={isGenerationExpanded(genId)}
                onToggle={() => onToggleGeneration(genId)}
              />
            </div>
          ) : null;
        }

        // Handle Pokémon items
        if (item.id) {
          console.log(`🚨🚨🚨 [POKEMON_GRID_WRONG_COMPONENT] Using PokemonCard for ${item.name} - THIS IS THE PROBLEM!`);
          
          if (isRankingArea) {
            // Use OptimizedDraggableCard for ranking areas
            console.log(`🔥🔥🔥 [POKEMON_GRID_FIX] Switching to OptimizedDraggableCard for ranking area`);
            return (
              <OptimizedDraggableCard
                key={`pokemon-${item.id}`}
                pokemon={item}
                index={index}
                isPending={false}
                showRank={false}
                isDraggable={true}
                context="available"
              />
            );
          } else {
            // For non-ranking areas, use PokemonCard but log it
            console.log(`🚨🚨🚨 [POKEMON_GRID_LEGACY] Using legacy PokemonCard for ${item.name} in non-ranking area`);
            return (
              <PokemonCard
                key={`pokemon-${item.id}`}
                pokemon={item}
                viewMode={viewMode}
                compact={viewMode === "list"}
              />
            );
          }
        }

        return null;
      })}
    </div>
  );
};
