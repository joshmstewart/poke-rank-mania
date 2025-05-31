
import React, { useState } from "react";
import { useDraggable } from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { normalizePokedexNumber } from "@/utils/pokemon";
import { getPokemonBackgroundColor } from "@/components/battle/utils/PokemonColorUtils";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface SharedPokemonCardProps {
  pokemon: Pokemon | RankedPokemon;
  showRankNumber?: boolean;
  rankNumber?: number;
  isAvailable?: boolean;
  onSuggestRanking?: (pokemon: any, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

export const SharedPokemonCard: React.FC<SharedPokemonCardProps> = ({
  pokemon,
  showRankNumber = false,
  rankNumber,
  isAvailable = false,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  const dragId = isAvailable ? `available-${pokemon.id}` : pokemon.id.toString();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dragId,
    data: {
      type: isAvailable ? 'available-pokemon' : 'ranked-pokemon',
      pokemon: pokemon,
      source: isAvailable ? 'available' : 'ranked'
    }
  });

  const handleImageLoad = (pokemonId: number) => {
    setLoadedImages(prev => new Set(prev).add(pokemonId));
  };

  const handleImageError = (pokemonId: number) => {
    console.warn(`Failed to load image for Pokemon ${pokemonId}`);
  };

  const normalizedId = normalizePokedexNumber(pokemon.id);
  const isImageLoaded = loadedImages.has(pokemon.id);
  const backgroundColor = getPokemonBackgroundColor(pokemon);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Type guard function to check if pokemon is RankedPokemon
  const isRankedPokemon = (p: Pokemon | RankedPokemon): p is RankedPokemon => {
    return 'score' in p && typeof (p as RankedPokemon).score === 'number';
  };

  return (
    <div className="relative group">
      {/* Info button - identical on both sides */}
      <div className="absolute top-1 right-1 z-50">
        <PokemonInfoModal pokemon={pokemon}>
          <button 
            className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            type="button"
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* Card structure - identical on both sides */}
      <div 
        ref={setNodeRef} 
        style={style}
        className={`${backgroundColor} rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 scale-105 z-40' : ''} ${isAvailable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        {...(isAvailable ? attributes : {})}
        {...(isAvailable ? listeners : {})}
      >
        {/* Header - rank number or transparent spacer */}
        <div className={`text-center py-1 ${showRankNumber ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' : 'bg-transparent text-transparent pointer-events-none'}`}>
          <span className="text-sm font-bold">
            {showRankNumber ? `#${rankNumber}` : '.'}
          </span>
        </div>

        {/* Pokemon image - identical on both sides */}
        <div className="aspect-square bg-gray-50/50 p-2 relative">
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={pokemon.image}
            alt={pokemon.name}
            className={`w-full h-full object-contain transition-opacity ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => handleImageLoad(pokemon.id)}
            onError={() => handleImageError(pokemon.id)}
            loading="lazy"
          />
        </div>

        {/* Pokemon info - identical on both sides with WHITE background */}
        <div className="p-2 space-y-1 bg-white">
          <h3 className="text-sm font-semibold text-center line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
            {pokemon.name}
          </h3>
          
          <div className="text-xs text-gray-500 text-center">
            #{normalizedId}
          </div>

          {/* Score for ranked Pokemon */}
          {isRankedPokemon(pokemon) && (
            <div className="text-xs text-center text-gray-600">
              Score: {pokemon.score.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedPokemonCard;
