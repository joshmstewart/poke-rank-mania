
import React from "react";
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PokemonModalContent from "@/components/pokemon/PokemonModalContent";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import { Badge } from "@/components/ui/badge";
import { Crown, Star } from "lucide-react";
import { useCloudPendingBattles } from "@/hooks/battle/useCloudPendingBattles";

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
  context?: 'available' | 'ranked';
  allRankedPokemon?: (Pokemon | RankedPokemon)[];
}

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = ({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = 'ranked',
  allRankedPokemon = []
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Use the cloud-based pending state hook
  const { isPokemonPending, addPendingPokemon, removePendingPokemon, isHydrated } = useCloudPendingBattles();
  
  const handlePrioritizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isHydrated) {
      return;
    }
    
    const currentlyPending = isPokemonPending(pokemon.id);
    
    if (!currentlyPending) {
      addPendingPokemon(pokemon.id);
    } else {
      removePendingPokemon(pokemon.id);
    }
  };

  // Check if this Pokemon has pending state
  const isPendingRefinement = isPokemonPending(pokemon.id);

  // Use consistent drag ID strategy
  const id = `${context}-${pokemon.id}`;
  const data = {
    type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
    pokemon: pokemon,
    source: context,
    index,
    isRanked: context === 'available' && 'isRanked' in pokemon && pokemon.isRanked
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id,
    data,
    disabled: !isDraggable || isOpen,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    cursor: isDraggable && !isOpen ? 'grab' : 'default',
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

  const handleMouseEnter = () => {
    if (!isDragging) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Format Pokemon ID with leading zeros
  const formattedId = pokemon.id.toString().padStart(pokemon.id >= 10000 ? 5 : 3, '0');

  // Determine if this Pokemon is ranked (for available context)
  const isRankedPokemon = context === 'available' && 'isRanked' in pokemon && pokemon.isRanked;
  const currentRank = isRankedPokemon && 'currentRank' in pokemon ? pokemon.currentRank : null;

  // Apply drag props when draggable and not in modal
  const dragProps = isDraggable && !isOpen ? { ...attributes, ...listeners } : {};

  console.log(`[PURE_DND_CARD] ${pokemon.name} - isDraggable: ${isDraggable}, context: ${context}, id: ${id}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden aspect-square flex flex-col group w-full ${
        isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging ? 'shadow-2xl border-blue-400' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-pokemon-id={pokemon.id}
      {...dragProps}
    >
      {/* Enhanced drag overlay for better visual feedback */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-30 rounded-lg pointer-events-none"></div>
      )}

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

      {/* Prioritize button - only visible on card hover */}
      {!isDragging && (context === 'ranked' || context === 'available') && (
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
          onClick={handlePrioritizeClick}
          className={`absolute top-1/2 right-2 -translate-y-1/2 z-30 p-1 rounded-full transition-opacity duration-300 ${
            isPendingRefinement
              ? 'opacity-100'
              : isHovered
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
          }`}
          title={isPendingRefinement ? "Remove from refinement queue" : "Prioritize for refinement battle"}
          type="button"
          disabled={!isHydrated}
        >
          <Star
            className={`w-4 h-4 transition-colors duration-300 ${
              isPendingRefinement ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500 hover:text-yellow-500'
            }`}
          />
        </button>
      )}

      {/* Info Button with Dialog - only visible on card hover */}
      {!isDragging && (
        <div className={`absolute top-1 right-1 z-30 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button 
                className="w-4 h-4 rounded-full bg-white/80 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                type="button"
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
      )}

      {/* Crown badge for ranked Pokemon in available section */}
      {context === 'available' && isRankedPokemon && currentRank && (
        <div className="absolute top-1 left-1 z-20">
          <Badge 
            variant="secondary" 
            className="bg-yellow-500 text-white font-bold text-xs px-1 py-0.5 shadow-md flex items-center gap-1"
          >
            <Crown size={8} />
            #{String(currentRank)}
          </Badge>
        </div>
      )}

      {/* Ranking number */}
      {context === 'ranked' && showRank && (
        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold z-10 shadow-sm border border-gray-200 ${
          isDragging ? 'bg-blue-100 border-blue-300' : ''
        }`}>
          <span className="text-black">{index + 1}</span>
        </div>
      )}
      
      {/* Pokemon image */}
      <div className="flex-1 flex justify-center items-center p-2">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-full h-full object-contain max-w-16 max-h-16 transition-all duration-200"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Pokemon info */}
      <div className="bg-white text-center py-1 px-1 mt-auto border-t border-gray-100">
        <h3 className="font-bold text-gray-800 text-xs leading-tight mb-0.5 truncate">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600 mb-0.5">
          #{formattedId}
        </div>
        
        {/* Score display */}
        {context === 'ranked' && 'score' in pokemon && (
          <div className="text-xs text-gray-700 font-medium truncate">
            {pokemon.score.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DraggablePokemonMilestoneCard);
