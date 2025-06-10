import React from "react";
import { useSortable } from '@dnd-kit/sortable';
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
  const { isPokemonPending, addPendingPokemon, isHydrated } = useCloudPendingBattles();
  
  console.log(`🌥️ [CARD_DEBUG] ${pokemon.name} card render - Pending: ${isPokemonPending(pokemon.id)}, Hydrated: ${isHydrated}`);
  
  const handlePrioritizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log(`🌥️ [CARD_DEBUG] ===== STAR CLICKED FOR ${pokemon.name} =====`);
    console.log(`🌥️ [CARD_DEBUG] Pokemon ID: ${pokemon.id}, Context: ${context}`);
    console.log(`🌥️ [CARD_DEBUG] Timestamp: ${new Date().toISOString()}`);
    
    if (!isHydrated) {
      console.warn(`🌥️ [CARD_DEBUG] ⚠️ Store not hydrated yet, skipping action`);
      return;
    }
    
    // Add to cloud-based pending state
    addPendingPokemon(pokemon.id);
  };

  // Check if this Pokemon has pending state
  const isPendingRefinement = isPokemonPending(pokemon.id);

  const sortableResult = useSortable({ 
    id: isDraggable ? (isAvailable ? `available-${pokemon.id}` : pokemon.id) : `static-${pokemon.id}`,
    disabled: !isDraggable || isOpen,
    data: {
      type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
      pokemon: pokemon,
      source: context,
      index,
      isRanked: context === 'available' && 'isRanked' in pokemon && pokemon.isRanked
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
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX || 1}) scaleY(${transform.scaleY || 1})` : 'translate3d(0, 0, 0)',
    transition: transition || undefined,
    minHeight: '140px',
    minWidth: '140px',
    zIndex: isDragging ? 1000 : 'auto',
    cursor: isDraggable && !isOpen ? 'grab' : 'default',
    willChange: isDragging ? 'transform' : 'auto',
    backfaceVisibility: 'hidden' as const,
    perspective: 1000,
    transformStyle: 'preserve-3d' as const
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group ${
        isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400 transform-gpu' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...(isDraggable && !isOpen ? attributes : {})}
      {...(isDraggable && !isOpen ? listeners : {})}
    >
      {/* Enhanced drag overlay for better visual feedback */}
      {isDragging && (
        <div 
          className="absolute inset-0 bg-blue-100 bg-opacity-30 rounded-lg pointer-events-none"
          style={{ transform: 'translateZ(0)' }}
        ></div>
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
            console.log(`🌥️ [CARD_DEBUG] onPointerDown called for ${pokemon.name}`);
          }}
          onClick={handlePrioritizeClick}
          className={`absolute top-1/2 right-2 -translate-y-1/2 z-30 p-2 rounded-full transition-all duration-300 ${
            isPendingRefinement 
              ? 'opacity-100' 
              : isHovered 
                ? 'opacity-100' 
                : 'opacity-0 pointer-events-none'
          }`}
          title="Prioritize for refinement battle"
          type="button"
          disabled={!isHydrated}
        >
          <Star
            className={`w-16 h-16 transition-all duration-300 ${
              isPendingRefinement ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500 hover:text-yellow-500'
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
                className="w-5 h-5 rounded-full bg-white/80 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm cursor-pointer"
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

      {/* Ranking number */}
      {context === 'ranked' && showRank && (
        <div className={`absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200 ${
          isDragging ? 'bg-blue-100 border-blue-300' : ''
        }`}>
          <span className="text-black">{index + 1}</span>
        </div>
      )}
      
      {/* Pokemon image */}
      <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className={`w-20 h-20 object-contain transition-all duration-200 ${
            isDragging ? 'scale-110' : ''
          }`}
          style={{ 
            transform: 'translateZ(0)',
            willChange: isDragging ? 'transform' : 'auto'
          }}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Pokemon info */}
      <div className={`bg-white text-center py-1.5 px-2 mt-auto border-t border-gray-100 ${
        isDragging ? 'bg-blue-50' : ''
      }`}>
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-0.5">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600 mb-1">
          #{formattedId}
        </div>
        
        {/* Score display */}
        {context === 'ranked' && 'score' in pokemon && (
          <div className="text-xs text-gray-700 font-medium">
            Score: {pokemon.score.toFixed(5)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggablePokemonMilestoneCard;
