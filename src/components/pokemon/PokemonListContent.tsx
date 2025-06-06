
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { Card } from "@/components/ui/card";
import PokemonInfoModal from "./PokemonInfoModal";
import PokemonCardImage from "./PokemonCardImage";
import PokemonCardInfo from "./PokemonCardInfo";
import GenerationHeader from "./GenerationHeader";
import { VotingArrows } from "@/components/ranking/VotingArrows";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import { formatPokemonName } from "@/utils/pokemon";
import { useDraggable } from '@dnd-kit/core';

interface PokemonListContentProps {
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isRankingArea: boolean;
  isGenerationExpanded?: (generationId: number) => boolean;
  onToggleGeneration?: (generationId: number) => void;
}

// Create a draggable wrapper for available Pokemon
const DraggableAvailablePokemonCard: React.FC<{ pokemon: any; index: number }> = ({ pokemon, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `available-${pokemon.id}`,
    data: {
      type: 'available-pokemon',
      pokemon: pokemon,
      source: 'available',
      index
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    zIndex: isDragging ? 1000 : 'auto'
  } : {
    cursor: 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <DraggablePokemonMilestoneCard
        pokemon={pokemon}
        index={index}
        isPending={false}
        showRank={false}
        isDraggable={false} // Let the wrapper handle dragging
        isAvailable={true}
        context="available"
      />
    </div>
  );
};

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

        // Render Pokemon
        if (item.type === 'pokemon' && item.data) {
          const pokemon = item.data;
          
          if (!pokemon || !pokemon.id) {
            console.warn(`🚨 [POKEMON_LIST_CONTENT] Skipping invalid Pokemon at index ${index}:`, pokemon);
            return null;
          }

          // Apply proper name formatting here
          const formattedPokemon = {
            ...pokemon,
            name: formatPokemonName(pokemon.name)
          };

          // Use draggable wrapper for available Pokemon
          if (!isRankingArea) {
            return (
              <DraggableAvailablePokemonCard
                key={`pokemon-${pokemon.id}-${index}`}
                pokemon={formattedPokemon}
                index={index}
              />
            );
          }

          // Original card for ranking area
          return (
            <Card 
              key={`pokemon-${pokemon.id}-${isRankingArea ? 'ranked' : 'available'}-${index}`}
              className="relative group hover:shadow-lg transition-shadow bg-white border border-gray-200"
            >
              <PokemonInfoModal pokemon={formattedPokemon}>
                <div className="p-4 cursor-pointer">
                  <PokemonCardImage 
                    pokemonId={formattedPokemon.id}
                    displayName={formattedPokemon.name}
                    imageUrl={formattedPokemon.image}
                    compact={false}
                    className=""
                  />
                  <PokemonCardInfo 
                    pokemonId={formattedPokemon.id}
                    displayName={formattedPokemon.name}
                    types={formattedPokemon.types}
                    flavorText={formattedPokemon.flavorText}
                  />
                </div>
              </PokemonInfoModal>
              
              {isRankingArea && 'score' in formattedPokemon && (
                <>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <VotingArrows
                      pokemon={formattedPokemon}
                      onSuggestRanking={() => {}}
                      onRemoveSuggestion={() => {}}
                    />
                  </div>
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </>
              )}
            </Card>
          );
        }

        return null;
      }).filter(Boolean)}
    </div>
  );
};
