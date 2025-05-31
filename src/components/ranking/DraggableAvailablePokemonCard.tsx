
import React from "react";
import { useDraggable } from '@dnd-kit/core';
import { Pokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "@/components/battle/utils/PokemonColorUtils";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface DraggableAvailablePokemonCardProps {
  pokemon: Pokemon;
}

const DraggableAvailablePokemonCard: React.FC<DraggableAvailablePokemonCardProps> = ({ 
  pokemon
}) => {
  console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] Setting up draggable for ${pokemon.name} (ID: ${pokemon.id})`);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `available-${pokemon.id}`,
    data: {
      pokemon,
      source: 'available',
      type: 'available-pokemon'
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

  // CRITICAL FIX: Handle info button interactions properly
  const handleInfoButtonClick = (e: React.MouseEvent) => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] Info button clicked for ${pokemon.name}`);
    // Stop all event propagation to prevent drag interference
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  // CRITICAL FIX: Create drag handlers that exclude info button area
  const dragListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      // Check if the click is on the info button or its children
      const target = e.target as HTMLElement;
      const isInfoButton = target.closest('[data-info-button="true"]') || 
                          target.closest('button') ||
                          target.textContent === 'i';
      
      if (isInfoButton) {
        console.log(`🔘 [DRAG_DEBUG] Ignoring pointer down on info button for ${pokemon.name}`);
        return;
      }
      
      console.log(`🔍 [DRAG_DEBUG] Starting drag for ${pokemon.name}`);
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl' : 'hover:shadow-lg transition-all duration-200'
      }`}
      {...attributes}
      {...dragListeners}
    >
      {/* Info Button - prevent drag interference */}
      <div 
        className="absolute top-1 right-1 z-30"
        onClick={handleInfoButtonClick}
        onPointerDown={handleInfoButtonClick}
        onMouseDown={handleInfoButtonClick}
      >
        <PokemonInfoModal pokemon={pokemon}>
          <button 
            className="w-5 h-5 rounded-full bg-white/80 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
            data-info-button="true"
            onClick={handleInfoButtonClick}
            onPointerDown={handleInfoButtonClick}
            onMouseDown={handleInfoButtonClick}
          >
            i
          </button>
        </PokemonInfoModal>
      </div>
      
      {/* Pokemon image - larger and taking up more space */}
      <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-20 h-20 object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Pokemon info - white section at bottom exactly like milestone */}
      <div className="bg-white text-center py-2 px-2 mt-auto border-t border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600">
          #{pokemon.id}
        </div>
      </div>
    </div>
  );
};

export default DraggableAvailablePokemonCard;
