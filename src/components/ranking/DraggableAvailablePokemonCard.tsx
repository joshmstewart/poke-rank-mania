
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
  
  // CRITICAL FIX: Simplified drag setup with proper event handling
  const dragId = `available-${pokemon.id}`;
  
  console.log(`🚨🚨🚨 [DRAGGABLE_AVAILABLE_SETUP] Setting up draggable for ${pokemon.name} (ID: ${pokemon.id}) with drag ID: ${dragId}`);
  
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

  // CRITICAL FIX: Info button with complete event isolation
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const handleInfoClick = (e: React.MouseEvent) => {
    console.log(`🔘🔘🔘 [INFO_BUTTON_CLICK_DETAILED] Info button clicked for ${pokemon.name} in Available`);
    e.stopPropagation();
    e.preventDefault();
    
    console.log(`🔘🔘🔘 [INFO_BUTTON_MODAL_ATTEMPT] Attempting to open modal for ${pokemon.name}`);
    setIsInfoModalOpen(true);
    console.log(`🔘🔘🔘 [INFO_BUTTON_MODAL_STATE] Modal state set to open for ${pokemon.name}`);
  };

  const handleModalOpenChange = (open: boolean) => {
    console.log(`🔘🔘🔘 [INFO_MODAL_STATE_CHANGE] Modal ${open ? 'opened' : 'closed'} for ${pokemon.name} in Available`);
    setIsInfoModalOpen(open);
  };

  // CRITICAL FIX: Enhanced pointer event logging
  const handlePointerDown = (e: React.PointerEvent) => {
    console.log(`🚨🚨🚨 [POINTER_DOWN_DETAILED] Pointer down on ${pokemon.name} - event details:`, {
      target: e.target,
      currentTarget: e.currentTarget,
      button: e.button,
      isPrimary: e.isPrimary
    });
    
    // Check if this is clicking on the info button
    const target = e.target as HTMLElement;
    if (target.closest('[data-info-button="true"]')) {
      console.log(`🚨🚨🚨 [POINTER_DOWN_INFO_BUTTON] Pointer down on info button - preventing drag`);
      return;
    }
    
    console.log(`🚨🚨🚨 [DRAG_ATTEMPT_START] Attempting to start drag for ${pokemon.name}`);
  };

  return (
    <div className="relative group">
      {/* CRITICAL FIX: Info button positioned absolutely outside draggable area */}
      <div 
        className="absolute top-1 right-1 z-50"
        style={{ 
          pointerEvents: 'auto',
          position: 'absolute',
          zIndex: 9999
        }}
      >
        <PokemonInfoModal 
          pokemon={pokemon}
          onOpenChange={handleModalOpenChange}
        >
          <button 
            className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200"
            onClick={handleInfoClick}
            onPointerDown={(e) => {
              console.log(`🔘🔘🔘 [INFO_BUTTON_POINTER_DOWN] Info button pointer down for ${pokemon.name}`);
              e.stopPropagation();
            }}
            type="button"
            data-info-button="true"
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* CRITICAL FIX: Draggable card with enhanced event handling */}
      <div 
        ref={setNodeRef} 
        style={style}
        className={`relative bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 scale-105 z-40' : ''} cursor-grab active:cursor-grabbing`}
        {...attributes}
        {...listeners}
        onPointerDown={handlePointerDown}
      >
        {/* Rank number badge - consistent with rankings style */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-center py-1">
          <span className="text-sm font-bold">Available</span>
        </div>

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

        {/* Pokemon info - consistent with rankings styling */}
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
