
import React, { memo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useDraggable } from '@dnd-kit/core';
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";
import PokemonMilestoneOverlays from "@/components/pokemon/PokemonMilestoneOverlays";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface DraggableAvailableCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
}

const DraggableAvailableCard: React.FC<DraggableAvailableCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true
}) => {
  console.log(`🔍 [DRAGGABLE_AVAILABLE_CARD] Rendering for ${pokemon.name}`);
  
  const uniqueId = `draggable-available-${pokemon.id}`;
  
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: uniqueId,
    disabled: !isDraggable,
    data: {
      type: 'available-pokemon',
      pokemon: pokemon,
      source: 'available',
      index,
      category: 'draggable-available'
    }
  });

  const backgroundColorClass = React.useMemo(() => getPokemonBackgroundColor(pokemon), [pokemon.id]);
  
  const style = React.useMemo(() => transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : undefined,
  } : undefined, [transform, isDragging]);

  const cardClassName = React.useMemo(() => {
    const baseClasses = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group`;
    const cursorClass = isDraggable ? 'cursor-grab active:cursor-grabbing' : '';
    const dragState = isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400 z-50' : 'hover:shadow-lg transition-all duration-200';
    const pendingState = isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
    
    // CRITICAL FIX: Ensure proper spacing and no overlap
    const spacingClasses = 'w-full min-w-0 flex-shrink-0';
    
    return `${baseClasses} ${cursorClass} ${dragState} ${pendingState} ${spacingClasses}`.trim();
  }, [backgroundColorClass, isDraggable, isDragging, isPending]);

  const getCurrentRank = React.useMemo((): number | null => {
    if ('currentRank' in pokemon && typeof pokemon.currentRank === 'number') {
      return pokemon.currentRank;
    }
    return null;
  }, [pokemon]);

  const finalAttributes = isDraggable ? attributes : {};
  const finalListeners = isDraggable ? listeners : {};

  return (
    <div
      ref={setNodeRef}
      className={cardClassName}
      style={{ ...style, minWidth: '140px', aspectRatio: '3/4' }}
      {...finalAttributes}
      {...finalListeners}
    >
      <PokemonMilestoneOverlays
        context="available"
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
        context="available"
      />
    </div>
  );
});

DraggableAvailableCard.displayName = 'DraggableAvailableCard';

export default DraggableAvailableCard;
