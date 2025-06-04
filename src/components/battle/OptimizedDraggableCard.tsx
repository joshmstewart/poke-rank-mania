
import React, { memo, useEffect, useMemo, useCallback } from "react";
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
  
  // CRITICAL FIX: Reduced logging to essential events only
  useEffect(() => {
    console.log(`[DRAGGABLE_CARD_INIT] ${pokemon.name} (${id}) - ${context}`);
  }, [pokemon.id, id, context]); // Minimal dependencies

  // CRITICAL FIX: Memoize hook data to prevent recreation
  const hookData = useMemo(() => ({
    id,
    disabled: !isDraggable,
    data: {
      type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
      pokemon: pokemon,
      source: context,
      index,
      category: context === 'available' ? 'draggable-pokemon' : 'sortable-pokemon'
    }
  }), [id, isDraggable, context, pokemon, index]);

  // CRITICAL FIX: Use only ONE hook per context (never both simultaneously)
  const activeResult = context === 'available'
    ? useDraggable(hookData)
    : useSortable(hookData);

  const { attributes, listeners, setNodeRef, isDragging, transform } = activeResult;

  // CRITICAL FIX: Memoize background color to prevent recalculation
  const backgroundColorClass = useMemo(() => getPokemonBackgroundColor(pokemon), [pokemon.id]);
  
  // CRITICAL FIX: Memoize drag props to prevent recreation
  const dragProps = useMemo(() => 
    isDraggable ? { ...attributes, ...listeners } : {}, 
    [isDraggable, attributes, listeners]
  );

  // CRITICAL FIX: Memoize style calculation
  const style = useMemo(() => transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined, [transform]);

  // CRITICAL FIX: Memoize class names to prevent recreation
  const cardClassName = useMemo(() => {
    const baseClasses = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group`;
    const cursorClass = isDraggable ? 'cursor-grab active:cursor-grabbing' : '';
    const dragState = isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400' : 'hover:shadow-lg transition-all duration-200';
    const pendingState = isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
    
    return `${baseClasses} ${cursorClass} ${dragState} ${pendingState}`;
  }, [backgroundColorClass, isDraggable, isDragging, isPending]);

  // CRITICAL FIX: Memoize getCurrentRank function
  const getCurrentRank = useMemo((): number | null => {
    if ('currentRank' in pokemon && typeof pokemon.currentRank === 'number') {
      return pokemon.currentRank;
    }
    return null;
  }, [pokemon]);

  // CRITICAL FIX: Minimal event logging
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(event);
    }
  }, [listeners]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (listeners?.onMouseDown) {
      listeners.onMouseDown(event);
    }
  }, [listeners]);

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
        currentRank={getCurrentRank}
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
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
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
  // CRITICAL FIX: Efficient prop comparison to prevent unnecessary re-renders
  return (
    prevProps.pokemon.id === nextProps.pokemon.id &&
    prevProps.index === nextProps.index &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.showRank === nextProps.showRank &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.context === nextProps.context
  );
});

OptimizedDraggableCard.displayName = 'OptimizedDraggableCard';

export default OptimizedDraggableCard;
