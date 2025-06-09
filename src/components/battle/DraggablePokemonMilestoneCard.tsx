
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
import { useSharedRefinementQueue } from "@/hooks/battle/useSharedRefinementQueue";

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
  context?: 'available' | 'ranked';
  allRankedPokemon?: (Pokemon | RankedPokemon)[]; // Add this to get neighboring Pokemon
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
  const [localPendingState, setLocalPendingState] = React.useState(() => {
    // Initialize from localStorage to persist across mode switches
    const stored = localStorage.getItem(`pokemon-pending-${pokemon.id}`);
    return stored === 'true';
  });

  // Get the refinement queue and functions
  const { refinementQueue, queueBattlesForReorder, hasRefinementBattles } = useSharedRefinementQueue();
  
  // FIXED: Better context detection - check if we actually have valid queue functions
  const contextAvailable = Boolean(
    refinementQueue && 
    Array.isArray(refinementQueue) && 
    typeof queueBattlesForReorder === 'function' &&
    typeof hasRefinementBattles === 'boolean'
  );
  
  console.log(`🌟 [STAR_DEBUG_DETAILED] Pokemon ${pokemon.name} (${pokemon.id}):`);
  console.log(`🌟 [STAR_DEBUG_DETAILED] - contextAvailable: ${contextAvailable}`);
  console.log(`🌟 [STAR_DEBUG_DETAILED] - refinementQueue length: ${refinementQueue?.length || 0}`);
  console.log(`🌟 [STAR_DEBUG_DETAILED] - hasRefinementBattles: ${hasRefinementBattles}`);
  console.log(`🌟 [STAR_DEBUG_DETAILED] - localPendingState: ${localPendingState}`);
  
  // Check if this Pokemon has any battles in the refinement queue
  const isPendingRefinement = contextAvailable ? (
    refinementQueue.some(battle => 
      battle.primaryPokemonId === pokemon.id || battle.opponentPokemonId === pokemon.id
    ) || localPendingState
  ) : localPendingState;

  console.log(`🌟 [STAR_DEBUG_DETAILED] - isPendingRefinement: ${isPendingRefinement}`);

  const handlePrioritizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log(`🌟 [PRIORITIZE_DETAILED] Clicked star for ${pokemon.name}`);
    console.log(`🌟 [PRIORITIZE_DETAILED] - contextAvailable: ${contextAvailable}`);
    console.log(`🌟 [PRIORITIZE_DETAILED] - current isPendingRefinement: ${isPendingRefinement}`);
    
    if (!isPendingRefinement) {
      console.log(`🌟 [PRIORITIZE_DETAILED] Adding ${pokemon.name} to refinement queue`);
      
      // Always set local pending state for immediate feedback AND persist it
      setLocalPendingState(true);
      localStorage.setItem(`pokemon-pending-${pokemon.id}`, 'true');
      
      if (contextAvailable) {
        console.log(`🌟 [PRIORITIZE_DETAILED] Context available, calling queueBattlesForReorder`);
        
        // FIXED: Generate proper neighbor battles for this Pokemon
        const neighbors: number[] = [];
        const currentIndex = allRankedPokemon.findIndex(p => p.id === pokemon.id);
        
        // Get 2-3 neighboring Pokemon for battles
        if (currentIndex >= 0) {
          // Add Pokemon before current position
          if (currentIndex > 0) {
            neighbors.push(allRankedPokemon[currentIndex - 1].id);
          }
          // Add Pokemon after current position  
          if (currentIndex < allRankedPokemon.length - 1) {
            neighbors.push(allRankedPokemon[currentIndex + 1].id);
          }
          // Add one more neighbor if available for better validation
          if (currentIndex > 1 && neighbors.length < 2) {
            neighbors.push(allRankedPokemon[currentIndex - 2].id);
          } else if (currentIndex < allRankedPokemon.length - 2 && neighbors.length < 2) {
            neighbors.push(allRankedPokemon[currentIndex + 2].id);
          }
        }
        
        console.log(`🌟 [PRIORITIZE_DETAILED] Generated neighbors for ${pokemon.name}:`, neighbors);
        queueBattlesForReorder(pokemon.id, neighbors, currentIndex);
      } else {
        console.log(`🌟 [PRIORITIZE_DETAILED] Context NOT available, persisting local state`);
        // Don't clear automatically - let it persist until user manually toggles or battles are processed
      }
    } else {
      console.log(`🌟 [PRIORITIZE_DETAILED] Pokemon ${pokemon.name} is already pending, toggling off`);
      setLocalPendingState(false);
      localStorage.removeItem(`pokemon-pending-${pokemon.id}`);
    }
  };

  // Clean up localStorage when Pokemon is actually processed in a battle
  React.useEffect(() => {
    if (contextAvailable && hasRefinementBattles === false && localPendingState) {
      // If we had pending state but no refinement battles exist, it means they were processed
      console.log(`🌟 [CLEANUP] Clearing pending state for ${pokemon.name} - battles processed`);
      setLocalPendingState(false);
      localStorage.removeItem(`pokemon-pending-${pokemon.id}`);
    }
  }, [contextAvailable, hasRefinementBattles, localPendingState, pokemon.id, pokemon.name]);

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

  // HARDWARE ACCELERATION: Optimized transform with GPU acceleration
  const style = {
    // Use transform3d for hardware acceleration
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX || 1}) scaleY(${transform.scaleY || 1})` : 'translate3d(0, 0, 0)',
    transition: transition || undefined,
    minHeight: '140px',
    minWidth: '140px',
    zIndex: isDragging ? 1000 : 'auto',
    cursor: isDraggable && !isOpen ? 'grab' : 'default',
    // Hardware acceleration optimizations
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

  // Format Pokemon ID with leading zeros
  const formattedId = pokemon.id.toString().padStart(pokemon.id >= 10000 ? 5 : 3, '0');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group ${
        isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400 transform-gpu' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      {...(isDraggable && !isOpen ? attributes : {})}
      {...(isDraggable && !isOpen ? listeners : {})}
    >
      {/* Enhanced drag overlay for better visual feedback with hardware acceleration */}
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

      {/* Prioritize button - only for ranked context and when not dragging */}
      {!isDragging && context === 'ranked' && (
        <button
          onClick={handlePrioritizeClick}
          className={`absolute top-1 right-8 z-30 p-1 rounded-full group-hover:opacity-100 transition-opacity duration-200 ${
            isPendingRefinement ? 'opacity-100' : 'opacity-25'
          }`}
          title="Prioritize for refinement battle"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          type="button"
          style={{ pointerEvents: 'auto' }}
        >
          <Star 
            className={`w-4 h-4 transition-all ${
              isPendingRefinement ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500 hover:text-yellow-500'
            }`} 
          />
        </button>
      )}

      {/* Info Button with Dialog - now only shows on hover and disabled during drag */}
      {!isDragging && (
        <div className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

      {/* Ranking number - white circle with black text in top left if showRank */}
      {context === 'ranked' && showRank && (
        <div className={`absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200 ${
          isDragging ? 'bg-blue-100 border-blue-300' : ''
        }`}>
          <span className="text-black">{index + 1}</span>
        </div>
      )}
      
      {/* Pokemon image - scaled to 20x20 (80px) with hardware acceleration */}
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
      
      {/* Pokemon info - white section at bottom with reduced padding */}
      <div className={`bg-white text-center py-1.5 px-2 mt-auto border-t border-gray-100 ${
        isDragging ? 'bg-blue-50' : ''
      }`}>
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-0.5">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600 mb-1">
          #{formattedId}
        </div>
        
        {/* Score display - only for ranked context - now with 5 decimal places */}
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
