
import React, { memo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useStableSortable } from "@/hooks/battle/useStableSortable";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";
import PokemonMilestoneOverlays from "@/components/pokemon/PokemonMilestoneOverlays";

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
  console.log(`🚀 [OPTIMIZED_CARD] ${pokemon.name}: Rendering optimized card`);

  // EXPLICITLY: Ensure consistent string ID that matches DndContext handlers
  const sortableId = pokemon.id.toString();
  
  const sortableConfig = {
    id: sortableId, // Explicit string ID for DndContext compatibility
    disabled: !isDraggable,
    data: {
      type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
      pokemon: pokemon,
      source: context,
      index
    }
  };

  console.log(`🔧 [DRAG_ID_FIX] Card ${pokemon.name} using sortable ID: ${sortableId}`);

  // EXPLICITLY: Use stable sortable hook that integrates with single SortableContext
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    style
  } = useStableSortable(sortableConfig);

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);
  
  // EXPLICITLY: Only apply drag props if draggable to prevent conflicts
  const dragProps = isDraggable ? { ...attributes, ...listeners } : {};

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
      style={style}
      className={cardClassName}
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
