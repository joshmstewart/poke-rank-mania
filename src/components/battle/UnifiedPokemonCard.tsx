
import React, { memo, useMemo, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useSortable } from '@dnd-kit/sortable';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";
import PokemonMilestoneOverlays from "@/components/pokemon/PokemonMilestoneOverlays";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface UnifiedPokemonCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  context?: 'available' | 'ranked';
}

const UnifiedPokemonCard: React.FC<UnifiedPokemonCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  context = 'ranked'
}) => {
  // ITEM 4: Add verification log at top-level
  useEffect(() => {
    console.log("✅ [HOOK_DEBUG] UnifiedPokemonCard - useEffect hook executed successfully");
  }, []);

  console.log(`🔍 [UNIFIED_CARD_DEBUG] UnifiedPokemonCard - ${pokemon.name} - context: ${context}`);
  
  // CRITICAL FIX: Always call BOTH hooks unconditionally, then use the appropriate one
  const sortableId = `sortable-ranking-${pokemon.id}`;
  const draggableId = `draggable-available-${pokemon.id}`;
  
  // Always call useSortable (for ranked context)
  const sortableResult = useSortable({
    id: sortableId,
    disabled: !isDraggable || context !== 'ranked',
    data: {
      type: 'ranked-pokemon',
      pokemon: pokemon,
      source: 'ranked',
      index,
      category: 'sortable-pokemon'
    }
  });

  // Always call useDraggable (for available context)
  const draggableResult = useDraggable({
    id: draggableId,
    disabled: !isDraggable || context !== 'available',
    data: {
      type: 'available-pokemon',
      pokemon: pokemon,
      source: 'available',
      index,
      category: 'draggable-pokemon'
    }
  });

  // Choose which result to use based on context
  const { attributes, listeners, setNodeRef, isDragging, transform } = useMemo(() => {
    if (context === 'available') {
      return {
        attributes: draggableResult.attributes,
        listeners: draggableResult.listeners,
        setNodeRef: draggableResult.setNodeRef,
        isDragging: draggableResult.isDragging,
        transform: draggableResult.transform
      };
    } else {
      return {
        attributes: sortableResult.attributes,
        listeners: sortableResult.listeners,
        setNodeRef: sortableResult.setNodeRef,
        isDragging: sortableResult.isDragging,
        transform: sortableResult.transform
      };
    }
  }, [context, sortableResult, draggableResult]);

  const backgroundColorClass = useMemo(() => getPokemonBackgroundColor(pokemon), [pokemon.id]);
  
  const style = useMemo(() => {
    if (!transform) return undefined;
    
    if (context === 'available') {
      // Use translate3d for available (draggable)
      return {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      };
    } else {
      // Use CSS.Transform for ranked (sortable)
      return {
        transform: CSS.Transform.toString(transform),
      };
    }
  }, [transform, context]);

  const cardClassName = useMemo(() => {
    const baseClasses = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group`;
    const cursorClass = isDraggable ? 'cursor-grab active:cursor-grabbing' : '';
    const dragState = isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400' : 'hover:shadow-lg transition-all duration-200';
    const pendingState = isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
    
    return `${baseClasses} ${cursorClass} ${dragState} ${pendingState}`;
  }, [backgroundColorClass, isDraggable, isDragging, isPending]);

  const getCurrentRank = useMemo((): number | null => {
    if ('currentRank' in pokemon && typeof pokemon.currentRank === 'number') {
      return pokemon.currentRank;
    }
    return null;
  }, [pokemon]);

  const dragProps = useMemo(() => 
    isDraggable ? { ...attributes, ...listeners } : {}, 
    [isDraggable, attributes, listeners]
  );

  console.log(`🔍 [UNIFIED_CARD_DEBUG] Rendering unified card for ${pokemon.name} in ${context} context`);

  return (
    <div
      ref={setNodeRef}
      className={cardClassName}
      style={{ ...style, minWidth: '140px' }}
      {...dragProps}
    >
      <PokemonMilestoneOverlays
        context={context}
        isRankedPokemon={'isRanked' in pokemon ? Boolean(pokemon.isRanked) : false}
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
              type="button"
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
});

UnifiedPokemonCard.displayName = 'UnifiedPokemonCard';

export default UnifiedPokemonCard;
