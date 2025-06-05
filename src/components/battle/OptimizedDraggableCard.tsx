
import React, { memo, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";
import PokemonMilestoneOverlays from "@/components/pokemon/PokemonMilestoneOverlays";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface OptimizedDraggableCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  context?: 'available' | 'ranked';
}

const OptimizedDraggableCard: React.FC<OptimizedDraggableCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  context = 'ranked'
}) => {
  // CRITICAL FIX: Use consistent ID formats with explicit prefixes
  const id = context === 'available' ? `available-${pokemon.id}` : `ranking-${pokemon.id}`;
  
  // 🔥 COMPREHENSIVE DIAGNOSTIC LOGGING
  useEffect(() => {
    console.log(`🔥🔥🔥 [OPTIMIZED_DRAGGABLE_CARD] ===== CARD INITIALIZATION =====`);
    console.log(`🔥🔥🔥 [OPTIMIZED_DRAGGABLE_CARD] Pokemon: ${pokemon.name} (ID: ${pokemon.id})`);
    console.log(`🔥🔥🔥 [OPTIMIZED_DRAGGABLE_CARD] Context: ${context}`);
    console.log(`🔥🔥🔥 [OPTIMIZED_DRAGGABLE_CARD] Generated ID: ${id}`);
    console.log(`🔥🔥🔥 [OPTIMIZED_DRAGGABLE_CARD] isDraggable: ${isDraggable}`);
    console.log(`🔥🔥🔥 [OPTIMIZED_DRAGGABLE_CARD] Component source: OptimizedDraggableCard.tsx`);
    
    if (context === 'available') {
      console.log(`🟢🟢🟢 [AVAILABLE_POKEMON_INIT] Available Pokemon ${pokemon.name} initializing with ID: ${id}`);
    } else {
      console.log(`🔵🔵🔵 [RANKED_POKEMON_INIT] Ranked Pokemon ${pokemon.name} initializing with ID: ${id}`);
    }
  }, [pokemon.id, pokemon.name, context, isDraggable, id]);

  console.log(`🎯 [DRAGGABLE_CARD_INIT] Initializing ${pokemon.name} with ID: ${id}, context: ${context}`);

  // CRITICAL FIX: Use only ONE hook per context (never both simultaneously)
  const activeResult = context === 'available'
    ? useDraggable({
        id,
        disabled: !isDraggable,
        data: {
          type: 'available-pokemon',
          pokemon: pokemon,
          source: context,
          index,
          category: 'draggable-pokemon'
        }
      })
    : useSortable({
        id,
        disabled: !isDraggable,
        data: {
          type: 'ranked-pokemon',
          pokemon: pokemon,
          source: context,
          index,
          accepts: ['available-pokemon', 'ranked-pokemon'],
          category: 'sortable-pokemon'
        }
      });

  const { attributes, listeners, setNodeRef, isDragging, transform } = activeResult;

  // CRITICAL: Enhanced hook initialization logging
  console.log(`🟢 [HOOK_INIT] ${pokemon.name} using ${context} hook:`, {
    isDragging,
    disabled: !isDraggable,
    context,
    hookType: context === 'available' ? 'useDraggable' : 'useSortable',
    id,
    hasAttributes: !!attributes,
    hasListeners: !!listeners,
    hasTransform: !!transform
  });

  // Additional logging for available Pokemon specifically
  if (context === 'available') {
    console.log(`🚀🚀🚀 [AVAILABLE_HOOK_DETAILED] ${pokemon.name} useDraggable result:`, {
      isDragging,
      id,
      disabled: !isDraggable,
      dataType: 'available-pokemon',
      hasSetNodeRef: !!setNodeRef,
      attributesKeys: attributes ? Object.keys(attributes) : [],
      listenersKeys: listeners ? Object.keys(listeners) : []
    });
  }

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);
  
  // Only apply drag props if draggable to prevent conflicts
  const dragProps = isDraggable ? { ...attributes, ...listeners } : {};

  // Apply transform for both draggable and sortable items
  const style = transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined;

  const cardClassName = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group ${
    isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
  } ${
    isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400' : 'hover:shadow-lg transition-all duration-200'
  } ${
    isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
  }`;

  // Fix the currentRank type issue
  const getCurrentRank = (): number | null => {
    if ('currentRank' in pokemon && typeof pokemon.currentRank === 'number') {
      return pokemon.currentRank;
    }
    return null;
  };

  // CRITICAL FIX: Add explicit event logging for drag events
  const handlePointerDown = (event: React.PointerEvent) => {
    console.log(`🎯 [DRAG_EVENT] PointerDown on ${pokemon.name} (${id}) - context: ${context}`);
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(event);
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    console.log(`🎯 [DRAG_EVENT] MouseDown on ${pokemon.name} (${id}) - context: ${context}`);
    if (listeners?.onMouseDown) {
      listeners.onMouseDown(event);
    }
  };

  console.log(`🚨🚨🚨 [COMPONENT_RENDER_EXIT] ${pokemon.name}: OptimizedDraggableCard render complete, about to return JSX`);

  return (
    <div
      ref={setNodeRef}
      className={cardClassName}
      style={{ ...style, minWidth: '140px' }}
      {...dragProps}
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
    >
      <PokemonMilestoneOverlays
        context={context}
        isRankedPokemon={context === 'available' && 'isRanked' in pokemon ? Boolean(pokemon.isRanked) : false}
        currentRank={getCurrentRank()}
        isPending={isPending}
        showRank={showRank}
        index={index}
        isDragging={isDragging}
      />
      
      {!isDragging && (
        <div className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <PokemonInfoModal pokemon={pokemon}>
            <button 
              className="w-5 h-5 rounded-full bg-white/80 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                console.log(`Info button clicked for ${pokemon.name}`);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              type="button"
              style={{ pointerEvents: 'auto' }}
            >
              i
            </button>
          </PokemonInfoModal>
        </div>
      )}
      
      <PokemonMilestoneImage
        pokemon={pokemon}
        isDragging={isDragging}
      />
      
      <PokemonMilestoneInfo
        pokemon={pokemon}
        isDragging={isDragging}
        context={context}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Comprehensive but efficient prop comparison
  const isEqual = (
    prevProps.pokemon.id === nextProps.pokemon.id &&
    prevProps.index === nextProps.index &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.showRank === nextProps.showRank &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.context === nextProps.context
  );
  
  console.log(`🎯 [MEMO_DEBUG] ${nextProps.pokemon.name}: ${isEqual ? 'PREVENTING' : 'ALLOWING'} re-render`);
  
  return isEqual;
});

OptimizedDraggableCard.displayName = 'OptimizedDraggableCard';

export default OptimizedDraggableCard;
