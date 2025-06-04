
import React, { memo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";
import PokemonMilestoneOverlays from "@/components/pokemon/PokemonMilestoneOverlays";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface SortableRankedCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
}

const SortableRankedCard: React.FC<SortableRankedCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true
}) => {
  console.log(`🔍 [SORTABLE_RANKED_CARD] Rendering for ${pokemon.name} with ID: sortable-ranking-${pokemon.id}`);
  
  const uniqueId = `sortable-ranking-${pokemon.id}`;
  
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    isDragging, 
    transform,
    transition,
    isOver
  } = useSortable({
    id: uniqueId,
    disabled: !isDraggable,
    data: {
      type: 'ranked-pokemon',
      pokemon: pokemon,
      source: 'ranked',
      index,
      category: 'sortable-ranked',
      accepts: ['available-pokemon']
    }
  });

  console.log(`🎯 [SORTABLE_DEBUG] Card ${pokemon.name}: isDragging=${isDragging}, isOver=${isOver}, transform=${!!transform}`);

  // Enhanced visual feedback during drag operations
  React.useEffect(() => {
    if (isOver) {
      console.log(`🎯 [HOVER_DEBUG] Ranked card ${pokemon.name} (ID: ${pokemon.id}) is being hovered over`);
    }
  }, [isOver, pokemon.name, pokemon.id]);

  const backgroundColorClass = React.useMemo(() => getPokemonBackgroundColor(pokemon), [pokemon.id]);
  
  const style = React.useMemo(() => {
    const baseStyle: React.CSSProperties = {
      transition: isDragging ? 'none' : (transition || 'transform 200ms ease'),
      zIndex: isDragging ? 1000 : undefined,
    };
    
    if (transform) {
      baseStyle.transform = CSS.Transform.toString(transform);
    }
    
    return baseStyle;
  }, [transform, transition, isDragging]);

  const cardClassName = React.useMemo(() => {
    const baseClasses = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group`;
    const cursorClass = isDraggable ? 'cursor-grab active:cursor-grabbing' : '';
    const dragState = isDragging ? 'opacity-50 scale-105 shadow-2xl border-blue-400 z-50' : 'hover:shadow-lg transition-all duration-200';
    const dropState = isOver ? 'ring-2 ring-green-400 ring-opacity-70 bg-green-50 scale-102 shadow-lg' : '';
    const pendingState = isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
    
    return `${baseClasses} ${cursorClass} ${dragState} ${dropState} ${pendingState}`.trim();
  }, [backgroundColorClass, isDraggable, isDragging, isOver, isPending]);

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
      style={{ ...style, minWidth: '140px' }}
      {...finalAttributes}
      {...finalListeners}
    >
      <PokemonMilestoneOverlays
        context="ranked"
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
        context="ranked"
      />
    </div>
  );
});

SortableRankedCard.displayName = 'SortableRankedCard';

export default SortableRankedCard;
