
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface DraggablePokemonCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
}

const DraggablePokemonCard: React.FC<DraggablePokemonCardProps> = ({ 
  pokemon, 
  index, 
  isPending = false 
}) => {
  console.log(`🎯 [CARD_RENDER_DEBUG] ===== RENDERING CARD =====`);
  console.log(`🎯 [CARD_RENDER_DEBUG] Pokemon: ${pokemon.name} (${pokemon.id})`);
  console.log(`🎯 [CARD_RENDER_DEBUG] Index: ${index}`);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: pokemon.id,
    data: {
      pokemon,
      index
    }
  });

  console.log(`🎯 [CARD_SORTABLE_DEBUG] useSortable result:`, {
    id: pokemon.id,
    isDragging,
    hasListeners: !!listeners,
    hasAttributes: !!attributes,
    hasTransform: !!transform
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  };

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

  console.log(`🎯 [CARD_DRAG_DEBUG] About to render with drag handlers attached`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col select-none ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl cursor-grabbing' : 'cursor-grab transition-transform duration-150'
      } ${isPending ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Pending indicator */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 text-center font-medium">
          Position pending validation
        </div>
      )}

      {/* Info Button - Prevent drag on this element */}
      <div 
        className="absolute top-1 right-1 z-30"
        {...attributes}
        onPointerDown={(e) => {
          console.log(`🎯 [INFO_BUTTON_DEBUG] Info button area pointer down - stopping propagation`);
          e.stopPropagation();
        }}
        onClick={(e) => {
          console.log(`🎯 [INFO_BUTTON_DEBUG] Info button area clicked - stopping propagation`);
          e.stopPropagation();
        }}
      >
        <PokemonInfoModal pokemon={pokemon}>
          <button 
            className="w-5 h-5 rounded-full bg-white/30 hover:bg-white/50 border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* Ranking number */}
      <div className={`absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200 ${isPending ? 'mt-6' : ''}`}>
        <span className="text-black">{index + 1}</span>
      </div>
      
      {/* Pokemon image */}
      <div className={`flex-1 flex justify-center items-center px-2 pb-1 ${isPending ? 'pt-8' : 'pt-6'}`}>
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-20 h-20 object-contain pointer-events-none"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Pokemon info */}
      <div className="bg-white text-center py-2 px-2 mt-auto border-t border-gray-100 pointer-events-none">
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

export default DraggablePokemonCard;
