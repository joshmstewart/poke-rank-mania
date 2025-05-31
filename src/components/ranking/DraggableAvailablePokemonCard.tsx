
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

  // Add debug logging for info button interactions
  const handleInfoButtonClick = (e: React.MouseEvent) => {
    console.log(`🔘🔘🔘 [AVAILABLE_INFO_DEBUG] Info button clicked for ${pokemon.name}`);
    console.log(`🔘🔘🔘 [AVAILABLE_INFO_DEBUG] Event:`, e.type);
    // Don't prevent default here - let the modal handle it
  };

  const handleInfoButtonPointerDown = (e: React.PointerEvent) => {
    console.log(`🔘🔘🔘 [AVAILABLE_INFO_DEBUG] Info button pointer down for ${pokemon.name}`);
    e.stopPropagation();
  };

  const handleInfoButtonMouseDown = (e: React.MouseEvent) => {
    console.log(`🔘🔘🔘 [AVAILABLE_INFO_DEBUG] Info button mouse down for ${pokemon.name}`);
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl' : 'hover:shadow-lg transition-all duration-200'
      }`}
    >
      {/* Info Button - CRITICAL: Outside drag area, comprehensive event handling */}
      <div className="absolute top-1 right-1 z-30">
        <PokemonInfoModal pokemon={pokemon}>
          <button 
            className="w-5 h-5 rounded-full bg-white/90 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
            onPointerDown={handleInfoButtonPointerDown}
            onMouseDown={handleInfoButtonMouseDown}
            onClick={handleInfoButtonClick}
          >
            i
          </button>
        </PokemonInfoModal>
      </div>
      
      {/* Draggable area - CRITICAL: Exclude the info button area completely */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ 
          clipPath: 'polygon(0% 0%, 85% 0%, 85% 25%, 100% 25%, 100% 100%, 0% 100%)'
        }}
        {...attributes}
        {...listeners}
      />
      
      {/* Pokemon image */}
      <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1 relative z-10 pointer-events-none">
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
      
      {/* Pokemon info */}
      <div className="bg-white text-center py-2 px-2 mt-auto border-t border-gray-100 relative z-10 pointer-events-none">
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
