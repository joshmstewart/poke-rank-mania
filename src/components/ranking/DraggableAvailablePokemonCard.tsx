
import React, { useState } from "react";
import { useDraggable } from '@dnd-kit/core';
import { Pokemon } from "@/services/pokemon";
import { Badge } from "@/components/ui/badge";
import { normalizePokedexNumber } from "@/utils/pokemon";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface DraggableAvailablePokemonCardProps {
  pokemon: Pokemon;
}

const typeColors: Record<string, string> = {
  Normal: "bg-gray-400", Fire: "bg-red-500", Water: "bg-blue-500", Electric: "bg-yellow-400",
  Grass: "bg-green-500", Ice: "bg-blue-200", Fighting: "bg-red-700", Poison: "bg-purple-600",
  Ground: "bg-yellow-700", Flying: "bg-indigo-300", Psychic: "bg-pink-500", Bug: "bg-lime-500",
  Rock: "bg-stone-500", Ghost: "bg-purple-700", Dragon: "bg-indigo-600", Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400", Fairy: "bg-pink-300",
};

export const DraggableAvailablePokemonCard: React.FC<DraggableAvailablePokemonCardProps> = ({
  pokemon
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  // CRITICAL: Enhanced draggable setup with comprehensive logging
  const dragId = `available-${pokemon.id}`;
  
  console.log(`🚨🚨🚨 [DRAGGABLE_AVAILABLE_ULTRA_CRITICAL] Setting up draggable for ${pokemon.name} (ID: ${pokemon.id})`);
  console.log(`🚨🚨🚨 [DRAGGABLE_AVAILABLE_ULTRA_CRITICAL] Drag ID: ${dragId}`);
  
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

  console.log(`🚨🚨🚨 [DRAGGABLE_AVAILABLE_ULTRA_CRITICAL] ${pokemon.name} - isDragging: ${isDragging}, transform: ${!!transform}`);

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative group ${isDragging ? 'opacity-50 scale-105 z-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* CRITICAL: Info button with proper isolation and event handling */}
      <div className="absolute top-1 right-1 z-50">
        <PokemonInfoModal 
          pokemon={pokemon}
          onOpenChange={(open) => {
            console.log(`🔘🔘🔘 [AVAILABLE_INFO_CRITICAL] Modal ${open ? 'opened' : 'closed'} for ${pokemon.name} in Available`);
          }}
        >
          <button 
            className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200 cursor-pointer relative z-50"
            onClick={(e) => {
              console.log(`🔘🔘🔘 [AVAILABLE_INFO_CRITICAL] Info button clicked for ${pokemon.name} in Available`);
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              console.log(`🔘🔘🔘 [AVAILABLE_INFO_CRITICAL] Info button pointer down for ${pokemon.name}`);
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              console.log(`🔘🔘🔘 [AVAILABLE_INFO_CRITICAL] Info button mouse down for ${pokemon.name}`);
              e.stopPropagation();
            }}
            type="button"
            style={{ 
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 60
            }}
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* Card with drag handles */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
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

        {/* Pokemon info */}
        <div className="p-2 space-y-1">
          <h3 className="text-sm font-semibold text-center line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
            {pokemon.name}
          </h3>
          
          <div className="text-xs text-gray-500 text-center">
            #{normalizedId}
          </div>

          {/* Types */}
          {pokemon.types && pokemon.types.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {pokemon.types.map(type => (
                <Badge 
                  key={type} 
                  className={`${typeColors[type]} text-white text-xs px-1 py-0.5 h-auto`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraggableAvailablePokemonCard;
