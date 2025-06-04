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

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
  context?: 'available' | 'ranked';
}

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = 'ranked'
}) => {
  // 🚨 DIAGNOSTIC LOGGING - This will help identify if this component is being used instead
  useEffect(() => {
    console.log(`🚨🚨🚨 [DRAGGABLE_MILESTONE_CARD] ===== DraggablePokemonMilestoneCard.tsx BEING USED! =====`);
    console.log(`🚨🚨🚨 [DRAGGABLE_MILESTONE_CARD] Pokemon: ${pokemon.name} (ID: ${pokemon.id})`);
    console.log(`🚨🚨🚨 [DRAGGABLE_MILESTONE_CARD] Component source: DraggablePokemonMilestoneCard.tsx`);
    console.log(`🚨🚨🚨 [DRAGGABLE_MILESTONE_CARD] Context: ${context}, isAvailable: ${isAvailable}`);
    console.log(`🚨🚨🚨 [DRAGGABLE_MILESTONE_CARD] This might be causing conflicts with OptimizedDraggableCard!`);
  }, [pokemon.id, pokemon.name, context, isAvailable]);

  const id = isAvailable ? `available-${pokemon.id}` : `ranking-${pokemon.id}`;
  
  console.log(`🎯 [MILESTONE_CARD_INIT] Initializing ${pokemon.name} with ID: ${id}, context: ${context}`);

  const draggableResult = useDraggable({
    id,
    disabled: !isDraggable || !isAvailable,
    data: {
      type: 'available-pokemon',
      pokemon: pokemon,
      source: context,
      index,
      category: 'draggable-milestone-available'
    }
  });

  const sortableResult = useSortable({
    id,
    disabled: !isDraggable || isAvailable,
    data: {
      type: 'ranked-pokemon',
      pokemon: pokemon,
      source: context,
      index,
      accepts: ['available-pokemon', 'ranked-pokemon'],
      category: 'sortable-milestone-ranked'
    }
  });

  const activeResult = isAvailable ? draggableResult : sortableResult;
  const { attributes, listeners, setNodeRef, isDragging, transform } = activeResult;

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);
  
  const dragProps = isDraggable ? { ...attributes, ...listeners } : {};

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
      style={{ ...style, minWidth: '140px' }}
      {...dragProps}
    >
      <PokemonMilestoneOverlays
        context={context}
        isRankedPokemon={!isAvailable && 'isRanked' in pokemon ? Boolean(pokemon.isRanked) : false}
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
});

DraggablePokemonMilestoneCard.displayName = 'DraggablePokemonMilestoneCard';

export default DraggablePokemonMilestoneCard;
