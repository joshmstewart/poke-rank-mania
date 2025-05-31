import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PokemonModalContent from "@/components/pokemon/PokemonModalContent";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
}

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = ({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Only use sortable if draggable
  const sortableResult = useSortable({ 
    id: isDraggable ? (isAvailable ? `available-${pokemon.id}` : pokemon.id) : `static-${pokemon.id}`,
    disabled: !isDraggable,
    data: {
      type: isAvailable ? 'available-pokemon' : 'ranked-pokemon',
      pokemon: pokemon,
      source: isAvailable ? 'available' : 'ranked',
      index
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
  };

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

  // Hooks for modal content
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, error: tcgError, hasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);

  // Determine what content to show
  const showLoading = isLoadingTCG;
  const showTCGCards = !isLoadingTCG && hasTcgCard && tcgCard !== null;
  const showFallbackInfo = !isLoadingTCG && !hasTcgCard;

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
    >
      {/* Pending banner if needed */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 px-2 z-20">
          Pending Battle
        </div>
      )}

      {/* Info Button with Dialog */}
      <div className="absolute top-1 right-1 z-30">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
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
          </DialogTrigger>
          
          <DialogContent 
            className="max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
            onClick={handleDialogClick}
            data-radix-dialog-content="true"
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                {pokemon.name}
              </DialogTitle>
            </DialogHeader>

            <PokemonModalContent
              pokemon={pokemon}
              showLoading={showLoading}
              showTCGCards={showTCGCards}
              showFallbackInfo={showFallbackInfo}
              tcgCard={tcgCard}
              secondTcgCard={secondTcgCard}
              flavorText={flavorText}
              isLoadingFlavor={isLoadingFlavor}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Ranking number - white circle with black text in top left if showRank */}
      {showRank && (
        <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200">
          <span className="text-black">{index + 1}</span>
        </div>
      )}
      
      {/* Pokemon image */}
      <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-20 h-20 object-contain"
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
        <div className="text-xs text-gray-600">
          #{pokemon.id}
        </div>
        {/* Score for ranked Pokemon */}
        {'score' in pokemon && (
          <div className="text-xs text-center text-gray-600">
            Score: {pokemon.score.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggablePokemonMilestoneCard;
