import React, { memo } from "react";
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
  console.log(`🚀 [OPTIMIZED_CARD] ${pokemon.name}: Rendering optimized card (context: ${context})`);

  // EXPLICIT NOTE: "All Filtered" Pokémon cards intentionally NOT sortable.
  // Sorted explicitly by Pokédex number.
  // Pokémon can ONLY be dragged into "Your Rankings" grid.
  
  // For Available Pokemon: Use useDraggable (no sorting within grid)
  // For Ranked Pokemon: Use useSortable (allows reordering within rankings)
  const sortableId = context === 'available' ? `available-${pokemon.id}` : pokemon.id.toString();
  
  console.log(`🔧 [DRAG_ID_FIX] Card ${pokemon.name} using ID: ${sortableId} (context: ${context})`);

  // CORRECTED: Available Pokemon use useDraggable only (no sorting)
  // Ranked Pokemon use useSortable (for reordering within rankings)
  let dragAttributes, dragListeners, setNodeRef, isDragging, transform, transition;

  if (context === 'available') {
    // Available Pokemon: draggable but not sortable
    const draggableConfig = {
      id: sortableId,
      disabled: !isDraggable,
      data: {
        type: 'available-pokemon',
        pokemon: pokemon,
        source: context,
        index
      }
    };

    const draggableResult = useDraggable(draggableConfig);
    dragAttributes = draggableResult.attributes;
    dragListeners = draggableResult.listeners;
    setNodeRef = draggableResult.setNodeRef;
    isDragging = draggableResult.isDragging;
    transform = null;
    transition = null;
  } else {
    // Ranked Pokemon: sortable within their grid
    const sortableConfig = {
      id: sortableId,
      disabled: !isDraggable,
      data: {
        type: 'ranked-pokemon',
        pokemon: pokemon,
        source: context,
        index
      }
    };

    const sortableResult = useSortable(sortableConfig);
    dragAttributes = sortableResult.attributes;
    dragListeners = sortableResult.listeners;
    setNodeRef = sortableResult.setNodeRef;
    isDragging = sortableResult.isDragging;
    transform = sortableResult.transform;
    transition = sortableResult.transition;
  }

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);
  
  // EXPLICITLY: Only apply drag props if draggable to prevent conflicts
  const dragProps = isDraggable ? { ...dragAttributes, ...dragListeners } : {};

  // Apply transform for sortable items
  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
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

  return (
    <div
      ref={setNodeRef}
      className={cardClassName}
      style={style}
      {...dragProps}
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
  
  console.log(`🚀 [OPTIMIZED_MEMO] ${nextProps.pokemon.name}: ${isEqual ? 'PREVENTING' : 'ALLOWING'} re-render`);
  
  return isEqual;
});

OptimizedDraggableCard.displayName = 'OptimizedDraggableCard';

export default OptimizedDraggableCard;
