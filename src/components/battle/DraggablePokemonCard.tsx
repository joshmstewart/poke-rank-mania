
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
  console.log(`🚨 [CARD_SETUP_DEBUG] ===== RENDERING CARD ${pokemon.name} =====`);
  console.log(`🚨 [CARD_SETUP_DEBUG] useSortable imported:`, typeof useSortable);
  console.log(`🚨 [CARD_SETUP_DEBUG] CSS imported:`, typeof CSS);

  const sortableResult = useSortable({ 
    id: pokemon.id,
    data: {
      pokemon,
      index
    }
  });

  console.log(`🚨 [CARD_SETUP_DEBUG] useSortable result for ${pokemon.name}:`, {
    id: pokemon.id,
    isDragging: sortableResult.isDragging,
    hasListeners: !!sortableResult.listeners,
    hasAttributes: !!sortableResult.attributes,
    hasTransform: !!sortableResult.transform,
    setNodeRef: typeof sortableResult.setNodeRef
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortableResult;

  // Critical debugging for drag handlers
  console.log(`🚨 [CARD_SETUP_DEBUG] Listeners object for ${pokemon.name}:`, listeners);
  console.log(`🚨 [CARD_SETUP_DEBUG] Attributes object for ${pokemon.name}:`, attributes);
  
  if (listeners) {
    Object.keys(listeners).forEach(key => {
      console.log(`🚨 [CARD_SETUP_DEBUG] Listener ${key} for ${pokemon.name}:`, typeof listeners[key]);
    });
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  };

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

  // CRITICAL: Add comprehensive event debugging
  const handlePointerDown = (e: React.PointerEvent) => {
    console.log(`🚨 [EVENT_FLOW_DEBUG] ===== ${pokemon.name} POINTER DOWN START =====`);
    console.log(`🚨 [EVENT_FLOW_DEBUG] Event details:`, {
      type: e.type,
      button: e.button,
      isPrimary: e.isPrimary,
      pressure: e.pressure,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target?.constructor?.name,
      currentTarget: e.currentTarget?.constructor?.name,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      defaultPrevented: e.defaultPrevented
    });

    // Check if dnd-kit listener exists and is callable
    if (listeners?.onPointerDown) {
      console.log(`🚨 [EVENT_FLOW_DEBUG] ✅ dnd-kit onPointerDown exists for ${pokemon.name}`);
      console.log(`🚨 [EVENT_FLOW_DEBUG] Listener type:`, typeof listeners.onPointerDown);
      
      try {
        console.log(`🚨 [EVENT_FLOW_DEBUG] 🚀 CALLING dnd-kit onPointerDown...`);
        listeners.onPointerDown(e);
        console.log(`🚨 [EVENT_FLOW_DEBUG] ✅ dnd-kit onPointerDown called successfully`);
      } catch (error) {
        console.error(`🚨 [EVENT_FLOW_DEBUG] ❌ Error calling dnd-kit onPointerDown:`, error);
      }
    } else {
      console.error(`🚨 [EVENT_FLOW_DEBUG] ❌ NO onPointerDown listener for ${pokemon.name}!`);
      console.error(`🚨 [EVENT_FLOW_DEBUG] Available listeners:`, Object.keys(listeners || {}));
    }

    console.log(`🚨 [EVENT_FLOW_DEBUG] Event after dnd-kit processing:`, {
      defaultPrevented: e.defaultPrevented,
      propagationStopped: e.isPropagationStopped?.() || 'unknown'
    });

    console.log(`🚨 [EVENT_FLOW_DEBUG] ===== ${pokemon.name} POINTER DOWN END =====`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log(`🚨 [EVENT_FLOW_DEBUG] ${pokemon.name} MOUSE DOWN:`, {
      button: e.button,
      buttons: e.buttons,
      detail: e.detail,
      clientX: e.clientX,
      clientY: e.clientY
    });
    
    if (listeners?.onMouseDown) {
      console.log(`🚨 [EVENT_FLOW_DEBUG] Calling dnd-kit onMouseDown for ${pokemon.name}`);
      listeners.onMouseDown(e);
    } else {
      console.error(`🚨 [EVENT_FLOW_DEBUG] No onMouseDown listener for ${pokemon.name}`);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    console.log(`🚨 [EVENT_FLOW_DEBUG] ${pokemon.name} TOUCH START:`, {
      touches: e.touches.length,
      changedTouches: e.changedTouches.length,
      targetTouches: e.targetTouches.length
    });
    
    if (listeners?.onTouchStart) {
      console.log(`🚨 [EVENT_FLOW_DEBUG] Calling dnd-kit onTouchStart for ${pokemon.name}`);
      listeners.onTouchStart(e);
    } else {
      console.error(`🚨 [EVENT_FLOW_DEBUG] No onTouchStart listener for ${pokemon.name}`);
    }
  };

  // Add click debugging
  const handleClick = (e: React.MouseEvent) => {
    console.log(`🚨 [EVENT_FLOW_DEBUG] ${pokemon.name} CLICK:`, {
      button: e.button,
      detail: e.detail,
      clientX: e.clientX,
      clientY: e.clientY,
      defaultPrevented: e.defaultPrevented
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col select-none touch-none cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
      {...attributes}
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      {/* Pending indicator */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 text-center font-medium pointer-events-none">
          Position pending validation
        </div>
      )}

      {/* Info Button - CRITICAL: Must prevent drag events */}
      <div 
        className="absolute top-1 right-1 z-30 pointer-events-auto"
        onPointerDown={(e) => {
          console.log(`🚨 [EVENT_FLOW_DEBUG] Info button pointer down for ${pokemon.name} - STOPPING PROPAGATION`);
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          console.log(`🚨 [EVENT_FLOW_DEBUG] Info button mouse down for ${pokemon.name} - STOPPING PROPAGATION`);
          e.stopPropagation();
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          console.log(`🚨 [EVENT_FLOW_DEBUG] Info button touch start for ${pokemon.name} - STOPPING PROPAGATION`);
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          console.log(`🚨 [EVENT_FLOW_DEBUG] Info button click for ${pokemon.name} - STOPPING PROPAGATION`);
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <PokemonInfoModal pokemon={pokemon}>
          <button 
            className="w-5 h-5 rounded-full bg-white/30 hover:bg-white/50 border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
            onPointerDown={(e) => {
              console.log(`🚨 [EVENT_FLOW_DEBUG] Info button inner button pointer down - STOPPING ALL`);
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              console.log(`🚨 [EVENT_FLOW_DEBUG] Info button inner button mouse down - STOPPING ALL`);
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              console.log(`🚨 [EVENT_FLOW_DEBUG] Info button inner button touch start - STOPPING ALL`);
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              console.log(`🚨 [EVENT_FLOW_DEBUG] Info button inner button click - STOPPING ALL`);
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* Ranking number */}
      <div className={`absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200 pointer-events-none ${isPending ? 'mt-6' : ''}`}>
        <span className="text-black">{index + 1}</span>
      </div>
      
      {/* Pokemon image */}
      <div className={`flex-1 flex justify-center items-center px-2 pb-1 pointer-events-none ${isPending ? 'pt-8' : 'pt-6'}`}>
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
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 pointer-events-none">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600 pointer-events-none">
          #{pokemon.id}
        </div>
      </div>
    </div>
  );
};

export default DraggablePokemonCard;
