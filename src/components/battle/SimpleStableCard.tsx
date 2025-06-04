
import React, { memo, useMemo, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";
import PokemonMilestoneOverlays from "@/components/pokemon/PokemonMilestoneOverlays";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface SimpleStableCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  context?: 'available' | 'ranked';
}

const SimpleStableCard: React.FC<SimpleStableCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  context = 'ranked'
}) => {
  // ITEM 4: Add verification log at top-level
  useEffect(() => {
    console.log("✅ [HOOK_DEBUG] SimpleStableCard - useEffect hook executed successfully");
  }, []);

  console.log(`🔍 [SIMPLE_STABLE_CARD] SimpleStableCard - ${pokemon.name} - context: ${context}`);
  
  // CRITICAL FIX: Use a SINGLE hook type per component to eliminate hook violations
  // This component ONLY uses useSortable - period. No conditionals, no variations.
  const uniqueId = `simple-stable-${pokemon.id}`;
  
  const { attributes, listeners, setNodeRef, isDragging, transform } = useSortable({
    id: uniqueId,
    disabled: false, // Always enabled to maintain stable hook calls
    data: {
      type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
      pokemon: pokemon,
      source: context,
      index,
      category: 'stable-pokemon'
    }
  });

  const backgroundColorClass = useMemo(() => getPokemonBackgroundColor(pokemon), [pokemon.id]);
  
  const style = useMemo(() => transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined, [transform]);

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

  // Apply drag props conditionally but NEVER conditionally call hooks
  const finalAttributes = isDraggable ? attributes : {};
  const finalListeners = isDraggable ? listeners : {};

  console.log(`🔍 [SIMPLE_STABLE_CARD] Rendering simple stable card for ${pokemon.name} in ${context} context`);

  return (
    <div
      ref={setNodeRef}
      className={cardClassName}
      style={{ ...style, minWidth: '140px' }}
      {...finalAttributes}
      {...finalListeners}
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

SimpleStableCard.displayName = 'SimpleStableCard';

export default SimpleStableCard;
