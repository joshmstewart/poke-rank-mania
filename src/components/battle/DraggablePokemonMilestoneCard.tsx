
import React from "react";
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PokemonModalContent from "@/components/pokemon/PokemonModalContent";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import { Badge } from "@/components/ui/badge";
import { Crown, Plus, Star } from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";
import CardActionMenu from "./CardActionMenu";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { availableId, rankedId } from "@/utils/id";

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
  context?: 'available' | 'ranked';
  allRankedPokemon?: (Pokemon | RankedPokemon)[];
  isStarred?: boolean;
  canStar?: boolean;
}

const PokemonCardDetailsDialog: React.FC<{
  pokemon: Pokemon | RankedPokemon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ pokemon, open, onOpenChange }) => {
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, open);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, hasTcgCard } = usePokemonTCGCard(pokemon.name, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
        onClick={(event) => event.stopPropagation()}
        data-radix-dialog-content="true"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {pokemon.name}
          </DialogTitle>
        </DialogHeader>

        <PokemonModalContent
          pokemon={pokemon}
          showLoading={isLoadingTCG}
          showTCGCards={!isLoadingTCG && hasTcgCard && tcgCard !== null}
          showFallbackInfo={!isLoadingTCG && !hasTcgCard}
          tcgCard={tcgCard}
          secondTcgCard={secondTcgCard}
          flavorText={flavorText}
          isLoadingFlavor={isLoadingFlavor}
        />
      </DialogContent>
    </Dialog>
  );
};

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = ({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = 'ranked',
  allRankedPokemon = [],
  isStarred,
  canStar,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const isHydrated = canStar ?? useTrueSkillStore.getState().isHydrated;
  const isPendingRefinement = isStarred ?? isPending;
  const addPendingPokemon = React.useCallback((pokemonId: number) => {
    useTrueSkillStore.getState().addPendingBattle(pokemonId);
    document.dispatchEvent(
      new CustomEvent('pokemon-starred-for-battle', {
        detail: { pokemonId, source: 'pokemon-card', timestamp: Date.now() },
      })
    );
  }, []);
  const removePendingPokemon = React.useCallback((pokemonId: number) => {
    useTrueSkillStore.getState().removePendingBattle(pokemonId);
  }, []);
  
  const handlePrioritizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isHydrated) {
      return;
    }
    
    if (!isPendingRefinement) {
      addPendingPokemon(pokemon.id);
    } else {
      removePendingPokemon(pokemon.id);
    }
  };

  const toggleStar = React.useCallback(() => {
    if (!isHydrated) return;
    if (isPendingRefinement) {
      removePendingPokemon(pokemon.id);
    } else {
      addPendingPokemon(pokemon.id);
    }
  }, [isHydrated, isPendingRefinement, addPendingPokemon, removePendingPokemon, pokemon.id]);

  // Use consistent drag ID strategy
  const id = context === 'available' ? availableId(pokemon.id) : rankedId(pokemon.id);
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
    disabled: !isDraggable || isOpen || menuOpen,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    cursor: isDraggable && !isOpen ? 'grab' : 'default',
    // Disable iOS text-selection callout ("Copy / Look Up / Translate") on long press.
    WebkitTouchCallout: 'none' as const,
    WebkitUserSelect: 'none' as const,
    userSelect: 'none' as const,
  };

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

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

  // Apply drag props when draggable and not in modal/menu
  const dragProps = isDraggable && !isOpen && !menuOpen ? { ...attributes, ...listeners } : {};

  // Compose card refs (dnd-kit + local).
  const setCardRef = React.useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node;
    setNodeRef(node);
  }, [setNodeRef]);

  const canTapToAdd = context === 'available' && !isRankedPokemon;
  const handleTapToAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    document.dispatchEvent(
      new CustomEvent('add-pokemon-to-rankings', { detail: { pokemonId: pokemon.id } })
    );
  };

  const dispatchRemove = React.useCallback(() => {
    document.dispatchEvent(
      new CustomEvent('remove-pokemon-from-rankings', { detail: { pokemonId: pokemon.id } })
    );
  }, [pokemon.id]);

  // Touch-only long-press handlers (no-ops on desktop / fine pointer).
  // Anchor the menu at the touch point (not card center) so it appears next
  // to the user's finger instead of drifting toward/below the card edge.
  const openMenu = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    setAnchorRect(new DOMRect(x, y, 1, 1));
    setMenuOpen(true);
  }, []);

  const handleTouchTap = React.useCallback(() => {
    if (canTapToAdd) {
      document.dispatchEvent(
        new CustomEvent('add-pokemon-to-rankings', { detail: { pokemonId: pokemon.id } })
      );
    } else if (context === 'ranked') {
      setIsOpen(true);
    }
  }, [canTapToAdd, context, pokemon.id]);

  const longPressHandlers = useLongPress<HTMLDivElement>({
    onLongPress: openMenu,
    onTap: handleTouchTap,
    threshold: 500,
    moveTolerance: 8,
    // CRITICAL: disable while dialog/menu is open. React bubbles portal
    // events through the React tree, so taps inside the dialog (e.g. the X
    // close button) would otherwise re-trigger card pointer handlers and
    // suppress the close click.
    disabled: !isDraggable || isOpen || menuOpen,
  });

  return (
    <div
      ref={setCardRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-border relative overflow-hidden aspect-square flex flex-col group w-full ${
        isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging ? 'shadow-2xl border-primary' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-primary/50' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-pokemon-id={pokemon.id}
      {...dragProps}
      {...longPressHandlers}
    >
      {/* Tap-to-add button (mobile-friendly, also works on desktop) */}
      {!isDragging && canTapToAdd && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleTapToAdd}
          className="absolute bottom-1 right-1 z-30 w-7 h-7 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center opacity-90 hover:opacity-100 active:scale-95 transition-all [@media(pointer:coarse)]:hidden"
          title="Add to rankings"
          aria-label={`Add ${pokemon.name} to rankings`}
          type="button"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
        </button>
      )}

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
          className={`absolute top-1/2 right-2 -translate-y-1/2 z-30 p-1 rounded-full transition-opacity duration-300 [@media(pointer:coarse)]:hidden ${
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

      {/* Info button. The heavy Dialog tree mounts only after opening. */}
      {!isDragging && (
        <div className={`absolute top-1 right-1 z-30 transition-all duration-300 [@media(pointer:coarse)]:hidden ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            className="w-4 h-4 rounded-full bg-background/90 hover:bg-background border border-border text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 cursor-pointer"
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
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            type="button"
          >
            i
          </button>
        </div>
      )}

      {isOpen && (
        <PokemonCardDetailsDialog
          pokemon={pokemon}
          open={isOpen}
          onOpenChange={setIsOpen}
        />
      )}

      {/* Touch-only: persistent star indicator (only when starred). */}
      {!isDragging && isPendingRefinement && (
        <div className="absolute bottom-1 left-1 z-20 hidden [@media(pointer:coarse)]:flex items-center justify-center w-5 h-5 rounded-full bg-background/80 shadow-sm">
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
        </div>
      )}

      {/* Touch-only: long-press action menu. */}
      {!isDragging && (
        <CardActionMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          context={context}
          isStarred={isPendingRefinement}
          canStar={isHydrated}
          onInfo={() => setIsOpen(true)}
          onToggleStar={toggleStar}
          onRemove={context === 'ranked' ? dispatchRemove : undefined}
          anchorRect={anchorRect}
        />
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
      
      {/* Pokemon image container - now truly dynamic */}
      <div className="flex-1 flex justify-center items-center p-1 min-h-0">
        <div className="w-full h-full flex justify-center items-center">
          <img 
            src={pokemon.image} 
            alt={pokemon.name}
            className="object-contain transition-all duration-200"
            style={{ 
              width: 'min(90%, 90%)',
              height: 'min(90%, 90%)',
              minWidth: '40px',
              minHeight: '40px'
            }}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      </div>
      
      {/* Pokemon info */}
      <div className="bg-white text-center py-1 px-1 mt-auto border-t border-gray-100 flex-shrink-0">
        <h3 className="font-bold text-gray-800 text-xs leading-tight mb-0.5 truncate">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600 mb-0.5">
          #{formattedId}
        </div>
        
        {/* Score display */}
        {context === 'ranked' && 'score' in pokemon && (
          <div className="text-xs text-gray-700 font-medium truncate">
            {pokemon.score.toFixed(5)}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DraggablePokemonMilestoneCard);
