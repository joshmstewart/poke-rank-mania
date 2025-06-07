
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { formatPokemonName } from "@/utils/pokemon";
import { Card } from "@/components/ui/card";
import { normalizePokedexNumber } from "@/utils/pokemon";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import PokemonCardImage from "@/components/pokemon/PokemonCardImage";

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  showRank?: boolean;
  isDraggable?: boolean;
  context?: "available" | "ranked";
  isPending?: boolean;
  isAvailable?: boolean;
}

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = ({
  pokemon,
  index,
  showRank = false,
  isDraggable = true,
  context = "ranked",
  isPending = false,
  isAvailable = false
}) => {
  const sortableId = isAvailable ? `available-${pokemon.id}` : pokemon.id.toString();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    disabled: !isDraggable,
    data: {
      type: context,
      pokemon: pokemon,
      index: index
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hardware acceleration for smooth dragging
    backfaceVisibility: 'hidden' as const,
    willChange: 'transform',
  };

  // CRITICAL FIX: Always format the display name
  const displayName = formatPokemonName(pokemon.name);
  console.log(`🔥 [MILESTONE_CARD_FORMAT_FIX] ${pokemon.name} -> ${displayName}`);
  
  const normalizedId = normalizePokedexNumber(pokemon.id);
  const isRanked = 'score' in pokemon;

  // Get confidence for visual feedback (only for ranked Pokemon)
  const confidence = isRanked ? (pokemon as RankedPokemon).confidence || 0 : 100;
  const confidenceColor = confidence >= 70 ? 'border-green-500' : 
                         confidence >= 40 ? 'border-yellow-500' : 'border-red-500';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-200 
        ${isDragging ? 'opacity-50 scale-105 rotate-2 z-50' : 'hover:shadow-lg'}
        ${isPending ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        ${isDraggable ? 'hover:scale-105' : ''}
        ${isRanked && confidence < 70 ? `border-2 ${confidenceColor}` : ''}
      `}
    >
      <div className="absolute top-1 right-1 z-10">
        <PokemonInfoModal pokemon={pokemon} />
      </div>

      {/* Rank badge */}
      {showRank && (
        <div className="absolute top-1 left-1 z-10">
          <div className="bg-white border-2 border-gray-800 text-gray-900 font-bold text-xs px-2 py-1 rounded-md shadow-sm">
            #{index + 1}
          </div>
        </div>
      )}

      <div className="flex flex-col p-2">
        {/* Image section */}
        <div className="aspect-square mb-2 flex items-center justify-center">
          <PokemonCardImage 
            pokemonId={pokemon.id}
            displayName={displayName}
            compact={false}
            imageUrl={pokemon.image}
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Info section */}
        <div className="text-center">
          <div className="text-xs font-medium leading-tight break-words mb-1">
            {displayName}
          </div>
          
          <div className="text-xs text-gray-500">
            #{normalizedId}
          </div>
          
          {/* Show score and confidence for ranked Pokemon */}
          {isRanked && (
            <div className="mt-1 space-y-1">
              <div className="text-xs font-semibold text-blue-600">
                {(pokemon as RankedPokemon).score.toFixed(1)}
              </div>
              {confidence < 70 && (
                <div className={`text-xs px-1 py-0.5 rounded text-white ${
                  confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {confidence.toFixed(0)}% conf
                </div>
              )}
            </div>
          )}
          
          {/* Available badge */}
          {isAvailable && !isRanked && (
            <div className="mt-1">
              <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                Available
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DraggablePokemonMilestoneCard;
