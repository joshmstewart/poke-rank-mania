
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
  context?: 'available' | 'ranked';
}

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = ({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = 'ranked'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Determine if this Pokemon is ranked (for available context)
  const isRankedPokemon = context === 'available' && 'isRanked' in pokemon && pokemon.isRanked;
  const currentRank = isRankedPokemon && 'currentRank' in pokemon ? pokemon.currentRank : null;

  // Only use sortable if draggable AND modal is not open
  const sortableResult = useSortable({ 
    id: isDraggable ? (isAvailable ? `available-${pokemon.id}` : pokemon.id) : `static-${pokemon.id}`,
    disabled: !isDraggable || isOpen, // Disable drag when modal is open
    data: {
      type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
      pokemon: pokemon,
      source: context,
      index,
      isRanked: isRankedPokemon
    }
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortableResult;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    minHeight: '140px',
    minWidth: '140px'
  };

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

  // Format Pokemon ID with leading zeros
  const formattedId = pokemon.id.toString().padStart(pokemon.id >= 10000 ? 5 : 3, '0');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group ${
        isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      {...(isDraggable && !isOpen ? attributes : {})}
      {...(isDraggable && !isOpen ? listeners : {})}
    >
      {/* Dark overlay for already-ranked Pokemon in available section */}
      {context === 'available' && isRankedPokemon && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg z-10"></div>
      )}

      {/* Pending banner if needed */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 px-2 z-20">
          Pending Battle
        </div>
      )}

      {/* Info Button - now matches battle mode exactly */}
      <div className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <PokemonInfoModal 
          pokemon={pokemon}
          onOpenChange={setIsOpen}
        />
      </div>

      {/* Crown badge for ranked Pokemon in available section */}
      {context === 'available' && isRankedPokemon && currentRank && (
        <div className="absolute top-2 left-2 z-20">
          <Badge 
            variant="secondary" 
            className="bg-yellow-500 text-white font-bold text-xs px-2 py-1 shadow-md flex items-center gap-1"
          >
            <Crown size={12} />
            #{String(currentRank)}
          </Badge>
        </div>
      )}

      {/* Ranking number - white circle with black text in top left if showRank */}
      {context === 'ranked' && showRank && (
        <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200">
          <span className="text-black">{index + 1}</span>
        </div>
      )}
      
      {/* Pokemon image */}
      <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-16 h-16 object-contain"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Pokemon info - white section at bottom */}
      <div className="bg-white text-center py-2 px-2 mt-auto border-t border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600 mb-2">
          #{formattedId}
        </div>
        
        {/* Score display - only for ranked context */}
        {context === 'ranked' && 'score' in pokemon && (
          <div className="text-xs text-gray-700 font-medium">
            Score: {pokemon.score.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggablePokemonMilestoneCard;
