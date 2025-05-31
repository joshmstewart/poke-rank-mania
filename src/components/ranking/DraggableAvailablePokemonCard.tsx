
import React, { useState } from "react";
import { useDraggable } from '@dnd-kit/core';
import { Pokemon } from "@/services/pokemon";
import { normalizePokedexNumber } from "@/utils/pokemon";
import { getPokemonBackgroundColor } from "@/components/battle/utils/PokemonColorUtils";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface DraggableAvailablePokemonCardProps {
  pokemon: Pokemon;
}

export const DraggableAvailablePokemonCard: React.FC<DraggableAvailablePokemonCardProps> = ({
  pokemon
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  const dragId = `available-${pokemon.id}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dragId,
    data: {
      type: 'available-pokemon',
      pokemon: pokemon,
      source: 'available'
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
  
  // CRITICAL: Use the exact same background color logic as ranking cards
  const backgroundColor = getPokemonBackgroundColor(pokemon);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  console.log(`🎨 [AVAILABLE_CARD_RENDER] ${pokemon.name}: backgroundColor=${backgroundColor}, types=${JSON.stringify(pokemon.types)}`);

  return (
    <div className="relative group">
      {/* Info button - EXACTLY matching ranking cards */}
      <div className="absolute top-1 right-1 z-50">
        <PokemonInfoModal pokemon={pokemon}>
          <button 
            className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200"
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* Card - IDENTICAL to ranking cards except no rank number */}
      <div 
        ref={setNodeRef} 
        style={style}
        className={`${backgroundColor} rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 scale-105 z-40' : ''} cursor-grab active:cursor-grabbing`}
        {...attributes}
        {...listeners}
      >
        {/* Pokemon image - IDENTICAL to ranking cards */}
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

        {/* Pokemon info - IDENTICAL to ranking cards with WHITE background */}
        <div className="p-2 space-y-1 bg-white">
          <h3 className="text-sm font-semibold text-center line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
            {pokemon.name}
          </h3>
          
          <div className="text-xs text-gray-500 text-center">
            #{normalizedId}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableAvailablePokemonCard;
