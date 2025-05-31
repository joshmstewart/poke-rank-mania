
import React, { useState } from "react";
import { useDraggable } from '@dnd-kit/core';
import { Pokemon } from "@/services/pokemon";
import { Badge } from "@/components/ui/badge";
import { normalizePokedexNumber } from "@/utils/pokemon";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface DraggableAvailablePokemonCardProps {
  pokemon: Pokemon;
}

export const DraggableAvailablePokemonCard: React.FC<DraggableAvailablePokemonCardProps> = ({
  pokemon
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  // CRITICAL FIX: Simplified draggable setup with essential logging only
  const dragId = `available-${pokemon.id}`;
  
  console.log(`🚨🚨🚨 [DRAGGABLE_AVAILABLE_ULTRA_CRITICAL] Setting up draggable for ${pokemon.name} (ID: ${pokemon.id})`);
  
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

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // CRITICAL FIX: Separate the info button from draggable area to prevent event conflicts
  const handleInfoClick = (e: React.MouseEvent) => {
    console.log(`🔘🔘🔘 [AVAILABLE_INFO_CRITICAL] Info button clicked for ${pokemon.name} in Available`);
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div className="relative group">
      {/* CRITICAL FIX: Info button outside of draggable container */}
      <div className="absolute top-1 right-1 z-50 pointer-events-auto">
        <PokemonInfoModal 
          pokemon={pokemon}
          onOpenChange={(open) => {
            console.log(`🔘🔘🔘 [AVAILABLE_INFO_CRITICAL] Modal ${open ? 'opened' : 'closed'} for ${pokemon.name} in Available`);
          }}
        >
          <button 
            className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200"
            onClick={handleInfoClick}
            style={{ 
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 60
            }}
            type="button"
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* CRITICAL FIX: Draggable card with proper drag event logging */}
      <div 
        ref={setNodeRef} 
        style={style}
        className={`relative ${isDragging ? 'opacity-50 scale-105 z-50' : ''} cursor-grab active:cursor-grabbing`}
        {...attributes}
        {...listeners}
        onPointerDown={(e) => {
          console.log(`🚨🚨🚨 [DRAG_START_CRITICAL] Pointer down on ${pokemon.name} - initiating drag`);
        }}
        onDragStart={(e) => {
          console.log(`🚨🚨🚨 [DRAG_START_CRITICAL] Native drag start for ${pokemon.name}`);
        }}
      >
        <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Pokemon image */}
          <div className="aspect-square bg-gray-50 p-2 relative">
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

          {/* Pokemon info - REMOVED TYPES as requested */}
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
    </div>
  );
};

export default DraggableAvailablePokemonCard;
