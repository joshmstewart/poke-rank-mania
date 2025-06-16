
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
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

  // Determine if this is available context
  const isAvailableContext = context === 'available';

  // Set up draggable ID and data
  const id = isDraggable ? (isAvailableContext ? `available-${pokemon.id}` : pokemon.id.toString()) : `static-${pokemon.id}`;
  const data = {
    type: isAvailableContext ? 'available-pokemon' : 'ranked-pokemon',
    pokemon: pokemon,
    source: context,
    index,
    isRanked: context === 'available' && 'isRanked' in pokemon && pokemon.isRanked
  };

  console.log(`[DRAG_CARD_DEBUG] ${pokemon.name} - isDraggable: ${isDraggable}, context: ${context}, id: ${id}`);

  // Use the appropriate hook based on context
  const draggableHook = useDraggable({
    id,
    data,
    disabled: !isDraggable || isOpen,
  });
  
  const sortableHook = useSortable({ 
    id,
    data,
    disabled: !isDraggable || isOpen,
  });

  // Choose which hook to use and extract properties
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = isAvailableContext ? draggableHook : sortableHook;

  const transition = !isAvailableContext ? sortableHook.transition : undefined;

  console.log(`[DRAG_CARD_DEBUG] ${pokemon.name} - attributes:`, attributes);
  console.log(`[DRAG_CARD_DEBUG] ${pokemon.name} - listeners:`, listeners);
  console.log(`[DRAG_CARD_DEBUG] ${pokemon.name} - isDragging: ${isDragging}`);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    minHeight: '140px',
    minWidth: '140px',
    zIndex: isDragging ? 1000 : 'auto',
    cursor: isDraggable && !isOpen ? 'grab' : 'default',
    willChange: 'transform' as const,
    backfaceVisibility: 'hidden' as const,
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

  // CRITICAL FIX: Always apply drag props when draggable, regardless of dialog state
  const dragProps = isDraggable ? { ...attributes, ...listeners } : {};

  console.log(`[DRAG_CARD_DEBUG] ${pokemon.name} - Final dragProps:`, dragProps);

  // ===== EVENT DEBUGGING =====
  const handlePointerDown = (e: React.PointerEvent) => {
    console.log(`🚨 [EVENT_DEBUG] ${pokemon.name} POINTER DOWN:`, {
      type: e.type,
      button: e.button,
      isPrimary: e.isPrimary,
      pressure: e.pressure,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target?.constructor?.name,
      currentTarget: e.currentTarget?.constructor?.name,
      defaultPrevented: e.defaultPrevented,
      bubbles: e.bubbles,
      cancelable: e.cancelable
    });

    // Call the original dnd-kit listener if it exists
    if (isDraggable && dragProps && 'onPointerDown' in dragProps && dragProps.onPointerDown) {
      console.log(`🚨 [EVENT_DEBUG] ${pokemon.name} calling dnd-kit onPointerDown`);
      dragProps.onPointerDown(e);
    } else {
      console.error(`🚨 [EVENT_DEBUG] ${pokemon.name} NO onPointerDown listener!`);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log(`🚨 [EVENT_DEBUG] ${pokemon.name} MOUSE DOWN:`, {
      button: e.button,
      buttons: e.buttons,
      detail: e.detail,
      clientX: e.clientX,
      clientY: e.clientY,
      defaultPrevented: e.defaultPrevented
    });

    if (isDraggable && dragProps && 'onMouseDown' in dragProps && dragProps.onMouseDown) {
      console.log(`🚨 [EVENT_DEBUG] ${pokemon.name} calling dnd-kit onMouseDown`);
      dragProps.onMouseDown(e);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    console.log(`🚨 [EVENT_DEBUG] ${pokemon.name} TOUCH START:`, {
      touches: e.touches.length,
      changedTouches: e.changedTouches.length,
      targetTouches: e.targetTouches.length,
      defaultPrevented: e.defaultPrevented
    });

    if (isDraggable && dragProps && 'onTouchStart' in dragProps && dragProps.onTouchStart) {
      console.log(`🚨 [EVENT_DEBUG] ${pokemon.name} calling dnd-kit onTouchStart`);
      dragProps.onTouchStart(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log(`🚨 [EVENT_DEBUG] ${pokemon.name} KEY DOWN:`, {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      defaultPrevented: e.defaultPrevented
    });

    if (isDraggable && dragProps && 'onKeyDown' in dragProps && dragProps.onKeyDown) {
      console.log(`🚨 [EVENT_DEBUG] ${pokemon.name} calling dnd-kit onKeyDown`);
      dragProps.onKeyDown(e);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    console.log(`🚨 [EVENT_DEBUG] ${pokemon.name} CLICK:`, {
      button: e.button,
      detail: e.detail,
      clientX: e.clientX,
      clientY: e.clientY,
      defaultPrevented: e.defaultPrevented,
      timeStamp: e.timeStamp
    });
  };

  // CSS debugging
  const checkCSSIssues = React.useCallback(() => {
    const element = document.querySelector(`[data-pokemon-id="${pokemon.id}"]`) as HTMLElement;
    if (element) {
      const computedStyle = getComputedStyle(element);
      console.log(`🎨 [CSS_DEBUG] ${pokemon.name} CSS:`, {
        pointerEvents: computedStyle.pointerEvents,
        zIndex: computedStyle.zIndex,
        position: computedStyle.position,
        transform: computedStyle.transform,
        opacity: computedStyle.opacity,
        overflow: computedStyle.overflow,
        display: computedStyle.display,
        visibility: computedStyle.visibility
      });
    }
  }, [pokemon.id, pokemon.name]);

  React.useEffect(() => {
    if (isDraggable) {
      checkCSSIssues();
    }
  }, [isDraggable, checkCSSIssues]);

  // Enhanced event props that override dnd-kit's to add debugging - only when draggable
  const enhancedEventProps = isDraggable ? {
    onPointerDown: handlePointerDown,
    onMouseDown: handleMouseDown,
    onTouchStart: handleTouchStart,
    onKeyDown: handleKeyDown,
    onClick: handleClick,
    // Still include the original attributes but NOT the original listeners
    ...attributes
  } : {};

  console.log(`🔧 [ENHANCED_PROPS] ${pokemon.name} enhanced props:`, enhancedEventProps);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group ${
        isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging ? 'shadow-2xl border-blue-400' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-pokemon-id={pokemon.id}
      {...enhancedEventProps}
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
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
          onClick={handlePrioritizeClick}
          className={`absolute top-1/2 right-2 -translate-y-1/2 z-30 p-2 rounded-full transition-opacity duration-300 ${
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
            className={`w-16 h-16 transition-colors duration-300 ${
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
            isDragging && isAvailableContext ? 'scale-110' : ''
          }`}
          style={{ 
            transform: 'translateZ(0)',
            willChange: isDragging && isAvailableContext ? 'transform' : 'auto'
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
        isDragging && isAvailableContext ? 'bg-blue-50' : ''
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

// Wrap the export in React.memo to prevent unnecessary re-renders
export default React.memo(DraggablePokemonMilestoneCard);
