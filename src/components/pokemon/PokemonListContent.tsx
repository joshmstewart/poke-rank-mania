
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { Card } from "@/components/ui/card";
import PokemonInfoModal from "./PokemonInfoModal";
import PokemonCardImage from "./PokemonCardImage";
import PokemonCardInfo from "./PokemonCardInfo";
import GenerationHeader from "./GenerationHeader";
import { VotingArrows } from "@/components/ranking/VotingArrows";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";

interface PokemonListContentProps {
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isRankingArea: boolean;
  isGenerationExpanded?: (generationId: number) => boolean;
  onToggleGeneration?: (generationId: number) => void;
}

export const PokemonListContent: React.FC<PokemonListContentProps> = ({
  items,
  showGenerationHeaders,
  viewMode,
  isRankingArea,
  isGenerationExpanded,
  onToggleGeneration
}) => {
  console.log(`🔍 [POKEMON_LIST_CONTENT] Rendering with itemCount: ${items.length}, showHeaders: ${showGenerationHeaders}`);

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isRankingArea ? "No ranked Pokémon yet" : "No available Pokémon"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        if (!item) {
          console.warn(`🚨 [POKEMON_LIST_CONTENT] Skipping null item at index ${index}`);
          return null;
        }

        // Render generation header
        if (item.type === 'header') {
          return (
            <div key={`gen-${item.generationId}`} className="w-full">
              <GenerationHeader
                generationId={item.generationId}
                name={item.data.name}
                region={item.data.region}
                games={item.data.games}
                viewMode={viewMode}
                isExpanded={isGenerationExpanded ? isGenerationExpanded(item.generationId) : true}
                onToggle={() => onToggleGeneration?.(item.generationId)}
              />
            </div>
          );
        }

        // Render Pokemon using OptimizedDraggableCard for consistency
        if (item.type === 'pokemon' && item.data) {
          const pokemon = item.data;
          
          if (!pokemon || !pokemon.id) {
            console.warn(`🚨 [POKEMON_LIST_CONTENT] Skipping invalid Pokemon at index ${index}:`, pokemon);
            return null;
          }

          // Use OptimizedDraggableCard for both available and ranked Pokemon
          return (
            <OptimizedDraggableCard
              key={`pokemon-${pokemon.id}-${index}`}
              pokemon={pokemon}
              index={index}
              isPending={false}
              showRank={isRankingArea}
              isDraggable={true}
              context={isRankingArea ? 'ranked' : 'available'}
            />
          );
        }

        return null;
      }).filter(Boolean)}
    </div>
  );
};
