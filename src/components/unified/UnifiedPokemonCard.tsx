
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from '@/services/pokemon';
import { getPokemonBackgroundColor } from '@/components/battle/utils/PokemonColorUtils';
import { Badge } from '@/components/ui/badge';
import { Crown, Star } from 'lucide-react';
import { useCloudPendingBattles } from '@/hooks/battle/useCloudPendingBattles';

interface UnifiedPokemonCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  context: 'available' | 'ranked';
  showRank?: boolean;
  isRanked?: boolean;
  currentRank?: number;
}

export const UnifiedPokemonCard: React.FC<UnifiedPokemonCardProps> = ({
  pokemon,
  index,
  context,
  showRank = false,
  isRanked = false,
  currentRank
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { isPokemonPending, addPendingPokemon, removePendingPokemon, isHydrated } = useCloudPendingBattles();

  const id = context === 'available' ? `available-${pokemon.id}` : pokemon.id.toString();
  const data = {
    type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
    pokemon,
    context,
    index
  };

  // Use sortable for ranked context, draggable for available context
  const sortable = useSortable({ id, data, disabled: context === 'available' });
  const draggable = useDraggable({ id, data, disabled: context === 'ranked' });

  const { attributes, listeners, setNodeRef, transform, isDragging } = context === 'ranked' ? sortable : draggable;
  const transition = context === 'ranked' ? sortable.transition : undefined;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Semi-transparent when dragging, not invisible
    zIndex: isDragging ? 1000 : 'auto',
  };

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);
  const isPendingRefinement = isPokemonPending(pokemon.id);
  const formattedId = pokemon.id.toString().padStart(pokemon.id >= 10000 ? 5 : 3, '0');

  const handlePrioritizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isHydrated) return;
    
    if (!isPendingRefinement) {
      addPendingPokemon(pokemon.id);
    } else {
      removePendingPokemon(pokemon.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 ${
        isDragging ? 'shadow-2xl border-blue-400' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...attributes}
      {...listeners}
    >
      {/* Dark overlay for already-ranked Pokemon in available section */}
      {context === 'available' && isRanked && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg z-10"></div>
      )}

      {/* Crown badge for ranked Pokemon in available section */}
      {context === 'available' && isRanked && currentRank && (
        <div className="absolute top-2 left-2 z-20">
          <Badge variant="secondary" className="bg-yellow-500 text-white font-bold text-xs px-2 py-1 shadow-md flex items-center gap-1">
            <Crown size={12} />
            #{currentRank}
          </Badge>
        </div>
      )}

      {/* Rank badge for ranked context */}
      {context === 'ranked' && showRank && (
        <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200">
          <span className="text-black">{index + 1}</span>
        </div>
      )}

      {/* Prioritize button */}
      {!isDragging && (
        <button
          onClick={handlePrioritizeClick}
          className={`absolute top-1/2 right-2 -translate-y-1/2 z-30 p-2 rounded-full transition-opacity duration-300 ${
            isPendingRefinement ? 'opacity-100' : isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title={isPendingRefinement ? "Remove from refinement queue" : "Prioritize for refinement battle"}
          type="button"
          disabled={!isHydrated}
        >
          <Star
            className={`w-16 h-16 transition-colors duration-300 ${
              isPendingRefinement ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500 hover:text-yellow-500'
            }`}
          />
        </button>
      )}

      {/* Pokemon image */}
      <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-20 h-20 object-contain transition-all duration-200"
          loading="lazy"
        />
      </div>
      
      {/* Pokemon info */}
      <div className="bg-white text-center py-1.5 px-2 mt-auto border-t border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-0.5">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600 mb-1">
          #{formattedId}
        </div>
        
        {/* Score display for ranked context */}
        {context === 'ranked' && 'score' in pokemon && (
          <div className="text-xs text-gray-700 font-medium">
            Score: {pokemon.score.toFixed(5)}
          </div>
        )}
      </div>
    </div>
  );
};
