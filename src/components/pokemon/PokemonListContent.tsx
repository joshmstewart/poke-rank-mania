
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { Card } from "@/components/ui/card";
import PokemonInfoModal from "./PokemonInfoModal";
import PokemonCardImage from "./PokemonCardImage";
import PokemonCardInfo from "./PokemonCardInfo";
import { VotingArrows } from "@/components/ranking/VotingArrows";

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
  console.log(`🔍 [AUTO_SCROLL_DEBUG] PokemonListContent rendering with itemCount: ${items.length}`);

  // Extract Pokemon from items with proper null checks
  const pokemon = items
    .filter(item => item && item.type === 'pokemon' && item.data) // Ensure item exists and has the right structure
    .map(item => item.data) // Extract the Pokemon data
    .filter(pokemonData => pokemonData && pokemonData.id) || []; // Ensure Pokemon data is valid

  console.log(`🔍 [POKEMON_EXTRACTION_DEBUG] Extracted ${pokemon.length} valid Pokemon from ${items.length} items`);

  if (pokemon.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isRankingArea ? "No ranked Pokémon yet" : "No available Pokémon"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {pokemon.map((pokemonItem, index) => {
        // Additional safety check before rendering
        if (!pokemonItem || !pokemonItem.id) {
          console.warn(`🚨 [POKEMON_RENDER_WARNING] Skipping invalid Pokemon at index ${index}:`, pokemonItem);
          return null;
        }

        return (
          <Card 
            key={`pokemon-${pokemonItem.id}-${isRankingArea ? 'ranked' : 'available'}-${index}`}
            className="relative group hover:shadow-lg transition-shadow bg-white border border-gray-200"
          >
            <PokemonInfoModal pokemon={pokemonItem}>
              <div className="p-4 cursor-pointer">
                <PokemonCardImage 
                  pokemonId={pokemonItem.id}
                  displayName={pokemonItem.name}
                  imageUrl={pokemonItem.image}
                  className=""
                />
                <PokemonCardInfo 
                  pokemonId={pokemonItem.id}
                  displayName={pokemonItem.name}
                  types={pokemonItem.types}
                  flavorText={pokemonItem.flavorText}
                />
              </div>
            </PokemonInfoModal>
            
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
        );
      }).filter(Boolean)} {/* Remove any null entries from the render */}
    </div>
  );
};
