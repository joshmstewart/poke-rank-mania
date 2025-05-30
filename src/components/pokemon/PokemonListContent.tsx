
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { Card } from "@/components/ui/card";
import PokemonModalTrigger from "./PokemonModalTrigger";
import PokemonCardImage from "./PokemonCardImage";
import PokemonCardInfo from "./PokemonCardInfo";
import { VotingArrows } from "@/components/ranking/VotingArrows";

interface PokemonListContentProps {
  droppableId: string;
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isRankingArea: boolean;
  isGenerationExpanded?: (generationId: number) => boolean;
  onToggleGeneration?: (generationId: number) => void;
}

export const PokemonListContent: React.FC<PokemonListContentProps> = ({
  droppableId,
  items,
  showGenerationHeaders,
  viewMode,
  isRankingArea,
  isGenerationExpanded,
  onToggleGeneration
}) => {
  console.log(`🔍 [AUTO_SCROLL_DEBUG] PokemonListContent rendering with itemCount: ${items.length}`);

  // Extract Pokemon from items (they might be wrapped in generation headers)
  const pokemon = items.filter(item => item.type === 'pokemon').map(item => item.pokemon) || [];

  if (pokemon.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isRankingArea ? "No ranked Pokémon yet" : "No available Pokémon"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {pokemon.map((pokemonItem, index) => (
        <Card 
          key={`pokemon-${pokemonItem.id}-${isRankingArea ? 'ranked' : 'available'}-${index}`}
          className="relative group hover:shadow-lg transition-shadow bg-white border border-gray-200"
        >
          <PokemonModalTrigger pokemon={pokemonItem}>
            <div className="p-4 cursor-pointer">
              <PokemonCardImage 
                pokemonId={pokemonItem.id}
                displayName={pokemonItem.name}
                imageUrl={pokemonItem.image}
              />
              <PokemonCardInfo 
                pokemonId={pokemonItem.id}
                displayName={pokemonItem.name}
                types={pokemonItem.types}
                flavorText={pokemonItem.flavorText}
              />
            </div>
          </PokemonModalTrigger>
          
          {isRankingArea && 'score' in pokemonItem && (
            <>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <VotingArrows
                  pokemon={pokemonItem}
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
      ))}
    </div>
  );
};
