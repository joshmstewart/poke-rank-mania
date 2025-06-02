
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { Card } from "@/components/ui/card";
import PokemonInfoModal from "./PokemonInfoModal";
import PokemonCardImage from "./PokemonCardImage";
import PokemonCardInfo from "./PokemonCardInfo";
import GenerationHeader from "./GenerationHeader";
import { VotingArrows } from "@/components/ranking/VotingArrows";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";

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

        // Render Pokemon
        if (item.type === 'pokemon' && item.data) {
          const pokemon = item.data;
          
          if (!pokemon || !pokemon.id) {
            console.warn(`🚨 [POKEMON_LIST_CONTENT] Skipping invalid Pokemon at index ${index}:`, pokemon);
            return null;
          }

          // Use the enhanced card component for available Pokemon to match rankings styling
          if (!isRankingArea) {
            return (
              <DraggablePokemonMilestoneCard
                key={`pokemon-${pokemon.id}-${index}`}
                pokemon={pokemon}
                index={index}
                isPending={false}
                showRank={false}
                isDraggable={true}
                isAvailable={true}
                context="available"
              />
            );
          }

          // Original card for ranking area
          return (
            <Card 
              key={`pokemon-${pokemon.id}-${isRankingArea ? 'ranked' : 'available'}-${index}`}
              className="relative group hover:shadow-lg transition-shadow bg-white border border-gray-200"
            >
              <PokemonInfoModal pokemon={pokemon}>
                <div className="p-4 cursor-pointer">
                  <PokemonCardImage 
                    pokemonId={pokemon.id}
                    displayName={pokemon.name}
                    imageUrl={pokemon.image}
                    className=""
                  />
                  <PokemonCardInfo 
                    pokemonId={pokemon.id}
                    displayName={pokemon.name}
                    types={pokemon.types}
                    flavorText={pokemon.flavorText}
                  />
                </div>
              </PokemonInfoModal>
              
              {isRankingArea && 'score' in pokemon && (
                <>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <VotingArrows
                      pokemon={pokemon}
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
