
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
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
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
  
  // CRITICAL: Use the same background color logic as ranking cards
  const backgroundColor = getPokemonBackgroundColor(pokemon);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`🔍 [AVAILABLE_INFO_CLICK] Info button clicked for ${pokemon.name}`);
    setIsInfoModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    console.log(`🔍 [AVAILABLE_MODAL_CHANGE] Modal ${open ? 'opened' : 'closed'} for ${pokemon.name}`);
    setIsInfoModalOpen(open);
  };

  console.log(`🎨 [AVAILABLE_CARD_RENDER] ${pokemon.name}: backgroundColor=${backgroundColor}, types=${JSON.stringify(pokemon.types)}`);

  return (
    <div className="relative group">
      {/* Info button - Same as ranking cards */}
      <div className="absolute top-1 right-1 z-50">
        <PokemonInfoModal 
          pokemon={pokemon}
          open={isInfoModalOpen}
          onOpenChange={handleModalOpenChange}
        >
          <button 
            className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200"
            onClick={handleInfoClick}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* Card - EXACTLY matching ranking cards with type-colored background */}
      <div 
        ref={setNodeRef} 
        style={style}
        className={`${backgroundColor} rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 scale-105 z-40' : ''} cursor-grab active:cursor-grabbing`}
        {...attributes}
        {...listeners}
      >
        {/* Available badge - blue instead of rank number */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-center py-1">
          <span className="text-sm font-bold">Available</span>
        </div>

        {/* Pokemon image - Same as ranking cards */}
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

        {/* Pokemon info - Same as ranking cards */}
        <div className="p-2 space-y-1">
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
