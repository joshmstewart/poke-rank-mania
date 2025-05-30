
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { Card } from "@/components/ui/card";
import { PokemonModalTrigger } from "./PokemonModalTrigger";
import { PokemonCardImage } from "./PokemonCardImage";
import { PokemonCardInfo } from "./PokemonCardInfo";
import { VotingArrows } from "@/components/ranking/VotingArrows";

interface PokemonListContentProps {
  pokemon: Pokemon[];
  isRanked: boolean;
  onSuggestRanking?: (pokemon: Pokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

export const PokemonListContent: React.FC<PokemonListContentProps> = ({
  pokemon,
  isRanked,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  console.log(`🔍 [AUTO_SCROLL_DEBUG] PokemonListContent rendering with itemCount: ${pokemon.length}`);

  if (pokemon.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isRanked ? "No ranked Pokémon yet" : "No available Pokémon"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {pokemon.map((pokemon, index) => (
        <Card 
          key={`pokemon-${pokemon.id}-${isRanked ? 'ranked' : 'available'}`} // Fixed: Unique keys
          className="relative group hover:shadow-lg transition-shadow bg-white border border-gray-200"
        >
          <PokemonModalTrigger pokemon={pokemon}>
            <div className="p-4 cursor-pointer">
              <PokemonCardImage 
                pokemon={pokemon} 
                className="w-full h-32 object-contain mx-auto mb-2"
              />
              <PokemonCardInfo pokemon={pokemon} />
            </div>
          </PokemonModalTrigger>
          
          {isRanked && onSuggestRanking && onRemoveSuggestion && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <VotingArrows
                pokemon={pokemon}
                onSuggestRanking={onSuggestRanking}
                onRemoveSuggestion={onRemoveSuggestion}
              />
            </div>
          )}
          
          {isRanked && 'score' in pokemon && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              #{index + 1}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
