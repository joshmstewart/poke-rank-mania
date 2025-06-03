
import React, { useMemo, useCallback, memo } from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonInfoButton from "@/components/pokemon/PokemonInfoButton";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";
import PokemonMilestoneOverlays from "@/components/pokemon/PokemonMilestoneOverlays";

interface DraggablePokemonMilestoneCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
  context?: 'available' | 'ranked';
}

// CRITICAL: Track renders with detailed prop analysis
let renderCount = 0;

// Type guard to check if pokemon is RankedPokemon
const isRankedPokemon = (pokemon: Pokemon | RankedPokemon): pokemon is RankedPokemon => {
  return 'score' in pokemon;
};

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = 'ranked'
}) => {
  renderCount++;
  console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name} (ID: ${pokemon.id}): Render #${renderCount}`);
  console.log(`🔍 [CARD_RENDER_DEBUG] Props: index=${index}, isPending=${isPending}, context=${context}, isDraggable=${isDraggable}`);

  const [isOpen, setIsOpen] = React.useState(false);

  // CRITICAL: Memoize all computed values with very specific dependencies
  const computedValues = useMemo(() => {
    const isRanked = context === 'available' && isRankedPokemon(pokemon) && 'isRanked' in pokemon 
      ? Boolean(pokemon.isRanked) 
      : false;
    const currentRank = (isRanked && 'currentRank' in pokemon && typeof pokemon.currentRank === 'number') 
      ? pokemon.currentRank 
      : null;
    const sortableId = isDraggable ? (isAvailable ? `available-${pokemon.id}` : pokemon.id) : `static-${pokemon.id}`;
    
    console.log(`🔍 [CARD_RENDER_DEBUG] Computed values for ${pokemon.name}: sortableId=${sortableId}, isRanked=${isRanked}`);
    
    return {
      isRankedPokemon: isRanked,
      currentRank,
      sortableId
    };
  }, [context, pokemon.id, isDraggable, isAvailable]);

  // CRITICAL: Stable sortable configuration - only depend on truly changing values
  const sortableConfig = useMemo(() => {
    const config = { 
      id: computedValues.sortableId,
      disabled: !isDraggable || isOpen,
      data: {
        type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
        pokemon: pokemon,
        source: context,
        index,
        isRanked: computedValues.isRankedPokemon
      }
    };
    
    console.log(`🔍 [CARD_RENDER_DEBUG] Sortable config created for ${pokemon.name}:`, config.id);
    return config;
  }, [computedValues.sortableId, isDraggable, isOpen, context, pokemon, index, computedValues.isRankedPokemon]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable(sortableConfig);

  // CRITICAL: Memoize style to prevent object recreation
  const cardStyle = useMemo(() => {
    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? 'none' : transition,
      minHeight: '140px',
      minWidth: '140px',
      zIndex: isDragging ? 1000 : 'auto',
      cursor: isDraggable && !isOpen ? 'grab' : 'default'
    };
    
    if (isDragging) {
      console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name} is being dragged, style updated`);
    }
    
    return style;
  }, [transform, isDragging, transition, isDraggable, isOpen]);

  // CRITICAL: Memoize background color
  const backgroundColorClass = useMemo(() => {
    const bgClass = getPokemonBackgroundColor(pokemon);
    console.log(`🔍 [CARD_RENDER_DEBUG] Background class for ${pokemon.name}: ${bgClass}`);
    return bgClass;
  }, [pokemon.types, pokemon.id]); // Only depend on types and id, not entire pokemon object

  // Only load modal content when actually opened
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, error: tcgError, hasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);

  // CRITICAL: Memoize modal flags
  const modalFlags = useMemo(() => ({
    showLoading: isLoadingTCG,
    showTCGCards: !isLoadingTCG && hasTcgCard && tcgCard !== null,
    showFallbackInfo: !isLoadingTCG && !hasTcgCard
  }), [isLoadingTCG, hasTcgCard, tcgCard]);

  // CRITICAL: Memoize drag props to prevent recreation
  const dragProps = useMemo(() => 
    isDraggable && !isOpen ? { ...attributes, ...listeners } : {}, 
    [isDraggable, isOpen, attributes, listeners]
  );

  // CRITICAL: Memoize className to prevent recreation
  const cardClassName = useMemo(() => {
    const baseClasses = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group`;
    const cursorClass = isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : '';
    const dragState = isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400 transform-gpu' : 'hover:shadow-lg transition-all duration-200';
    const pendingState = isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
    
    return `${baseClasses} ${cursorClass} ${dragState} ${pendingState}`;
  }, [backgroundColorClass, isDraggable, isOpen, isDragging, isPending]);

  // CRITICAL: Stable callback for modal toggle
  const handleToggleModal = useCallback((open: boolean) => {
    console.log(`🔍 [CARD_RENDER_DEBUG] Modal toggle for ${pokemon.name}: ${open}`);
    setIsOpen(open);
  }, [pokemon.name]);

  console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name} render complete, returning JSX`);

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className={cardClassName}
      {...dragProps}
    >
      <PokemonMilestoneOverlays
        context={context}
        isRankedPokemon={computedValues.isRankedPokemon}
        currentRank={computedValues.currentRank}
        isPending={isPending}
        showRank={showRank}
        index={index}
        isDragging={isDragging}
      />

      <PokemonInfoButton
        pokemon={pokemon}
        isOpen={isOpen}
        setIsOpen={handleToggleModal}
        isDragging={isDragging}
        showLoading={modalFlags.showLoading}
        showTCGCards={modalFlags.showTCGCards}
        showFallbackInfo={modalFlags.showFallbackInfo}
        tcgCard={tcgCard}
        secondTcgCard={secondTcgCard}
        flavorText={flavorText}
        isLoadingFlavor={isLoadingFlavor}
      />
      
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
}, (prevProps, nextProps) => {
  // CRITICAL: Very detailed comparison with logging
  const pokemonChanged = prevProps.pokemon.id !== nextProps.pokemon.id;
  const indexChanged = prevProps.index !== nextProps.index;
  const pendingChanged = prevProps.isPending !== nextProps.isPending;
  const rankChanged = prevProps.showRank !== nextProps.showRank;
  const draggableChanged = prevProps.isDraggable !== nextProps.isDraggable;
  const availableChanged = prevProps.isAvailable !== nextProps.isAvailable;
  const contextChanged = prevProps.context !== nextProps.context;
  
  const shouldUpdate = pokemonChanged || indexChanged || pendingChanged || rankChanged || draggableChanged || availableChanged || contextChanged;
  
  if (shouldUpdate) {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${nextProps.pokemon.name}: Props changed, allowing re-render`);
    if (pokemonChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Pokemon ID: ${prevProps.pokemon.id} -> ${nextProps.pokemon.id}`);
    if (indexChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Index: ${prevProps.index} -> ${nextProps.index}`);
    if (pendingChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Pending: ${prevProps.isPending} -> ${nextProps.isPending}`);
    if (rankChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - ShowRank: ${prevProps.showRank} -> ${nextProps.showRank}`);
    if (draggableChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Draggable: ${prevProps.isDraggable} -> ${nextProps.isDraggable}`);
    if (availableChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Available: ${prevProps.isAvailable} -> ${nextProps.isAvailable}`);
    if (contextChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Context: ${prevProps.context} -> ${nextProps.context}`);
  } else {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${nextProps.pokemon.name}: No meaningful prop changes, preventing re-render`);
  }
  
  return !shouldUpdate;
});

DraggablePokemonMilestoneCard.displayName = 'DraggablePokemonMilestoneCard';

export default DraggablePokemonMilestoneCard;
