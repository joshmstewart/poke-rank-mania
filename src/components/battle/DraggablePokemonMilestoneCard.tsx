
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

// Global render tracking for performance debugging
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
  
  // CRITICAL: Log render start IMMEDIATELY to catch any renders
  console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name} (ID: ${pokemon.id}): Render #${renderCount} STARTED`);

  const [isOpen, setIsOpen] = React.useState(false);

  // Memoize computed values with very specific dependencies
  const computedValues = useMemo(() => {
    const hasIsRankedProperty = 'isRanked' in pokemon;
    const isRankedValue = hasIsRankedProperty ? Boolean((pokemon as any).isRanked) : false;
    const isRanked = context === 'available' && isRankedValue;
    
    const hasCurrentRankProperty = 'currentRank' in pokemon;
    const currentRankValue = hasCurrentRankProperty ? (pokemon as any).currentRank : null;
    const currentRank = (isRanked && typeof currentRankValue === 'number') ? currentRankValue : null;
    
    const sortableId = isDraggable ? (isAvailable ? `available-${pokemon.id}` : pokemon.id) : `static-${pokemon.id}`;
    
    console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name}: Computed values - sortableId=${sortableId}, isRanked=${isRanked}, currentRank=${currentRank}`);
    
    return {
      isRankedPokemon: isRanked,
      currentRank,
      sortableId
    };
  }, [
    context, 
    pokemon.id, 
    'isRanked' in pokemon ? (pokemon as any).isRanked : false,
    'currentRank' in pokemon ? (pokemon as any).currentRank : null,
    isDraggable, 
    isAvailable
  ]);

  // Stable sortable configuration - memoized to prevent recreation
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
    
    console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name}: Sortable config created - disabled: ${config.disabled}`);
    return config;
  }, [
    computedValues.sortableId, 
    isDraggable, 
    isOpen, 
    context, 
    pokemon.id, 
    pokemon.name,
    index, 
    computedValues.isRankedPokemon
  ]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable(sortableConfig);

  // Memoize style to prevent object recreation
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
      console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name}: Is being dragged`);
    }
    
    return style;
  }, [transform, isDragging, transition, isDraggable, isOpen]);

  // Memoize background color based only on pokemon types
  const backgroundColorClass = useMemo(() => {
    const bgClass = getPokemonBackgroundColor(pokemon);
    return bgClass;
  }, [pokemon.types?.join(',') || '', pokemon.id]);

  // Conditional hooks - only when modal is open to minimize updates
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, error: tcgError, hasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);

  // Memoize modal flags to prevent recreation
  const modalFlags = useMemo(() => ({
    showLoading: isLoadingTCG,
    showTCGCards: !isLoadingTCG && hasTcgCard && tcgCard !== null,
    showFallbackInfo: !isLoadingTCG && !hasTcgCard
  }), [isLoadingTCG, hasTcgCard, tcgCard]);

  // Memoize drag props to prevent recreation
  const dragProps = useMemo(() => 
    isDraggable && !isOpen ? { ...attributes, ...listeners } : {}, 
    [isDraggable, isOpen, attributes, listeners]
  );

  // Memoize className to prevent recreation
  const cardClassName = useMemo(() => {
    const baseClasses = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group`;
    const cursorClass = isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : '';
    const dragState = isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400 transform-gpu' : 'hover:shadow-lg transition-all duration-200';
    const pendingState = isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
    
    return `${baseClasses} ${cursorClass} ${dragState} ${pendingState}`;
  }, [backgroundColorClass, isDraggable, isOpen, isDragging, isPending]);

  // Stable callback for modal toggle
  const handleToggleModal = useCallback((open: boolean) => {
    console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name}: Modal toggle to ${open}`);
    setIsOpen(open);
  }, [pokemon.name]);

  console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name} (ID: ${pokemon.id}): Render #${renderCount} COMPLETED`);

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
  // ENHANCED MEMO DEBUG: Log every comparison attempt
  console.log(`🔍 [CARD_MEMO_DEBUG] ${nextProps.pokemon.name}: Starting memo comparison`);
  
  // Check each prop individually and log changes
  const pokemonChanged = prevProps.pokemon.id !== nextProps.pokemon.id;
  const indexChanged = prevProps.index !== nextProps.index;
  const pendingChanged = prevProps.isPending !== nextProps.isPending;
  const rankChanged = prevProps.showRank !== nextProps.showRank;
  const draggableChanged = prevProps.isDraggable !== nextProps.isDraggable;
  const availableChanged = prevProps.isAvailable !== nextProps.isAvailable;
  const contextChanged = prevProps.context !== nextProps.context;
  
  // Additional deep prop checks for Pokemon object
  const pokemonNameChanged = prevProps.pokemon.name !== nextProps.pokemon.name;
  const pokemonTypesChanged = JSON.stringify(prevProps.pokemon.types) !== JSON.stringify(nextProps.pokemon.types);
  
  // Check for isRanked and currentRank changes if they exist
  const prevIsRanked = 'isRanked' in prevProps.pokemon ? (prevProps.pokemon as any).isRanked : undefined;
  const nextIsRanked = 'isRanked' in nextProps.pokemon ? (nextProps.pokemon as any).isRanked : undefined;
  const isRankedChanged = prevIsRanked !== nextIsRanked;
  
  const prevCurrentRank = 'currentRank' in prevProps.pokemon ? (prevProps.pokemon as any).currentRank : undefined;
  const nextCurrentRank = 'currentRank' in nextProps.pokemon ? (nextProps.pokemon as any).currentRank : undefined;
  const currentRankChanged = prevCurrentRank !== nextCurrentRank;
  
  const shouldUpdate = pokemonChanged || indexChanged || pendingChanged || rankChanged || 
                     draggableChanged || availableChanged || contextChanged || 
                     pokemonNameChanged || pokemonTypesChanged || isRankedChanged || currentRankChanged;
  
  if (shouldUpdate) {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${nextProps.pokemon.name}: Props changed - ALLOWING RE-RENDER`);
    if (pokemonChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Pokemon ID: ${prevProps.pokemon.id} -> ${nextProps.pokemon.id}`);
    if (indexChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Index: ${prevProps.index} -> ${nextProps.index}`);
    if (pendingChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Pending: ${prevProps.isPending} -> ${nextProps.isPending}`);
    if (rankChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - ShowRank: ${prevProps.showRank} -> ${nextProps.showRank}`);
    if (draggableChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Draggable: ${prevProps.isDraggable} -> ${nextProps.isDraggable}`);
    if (availableChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Available: ${prevProps.isAvailable} -> ${nextProps.isAvailable}`);
    if (contextChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Context: ${prevProps.context} -> ${nextProps.context}`);
    if (pokemonNameChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Pokemon Name: ${prevProps.pokemon.name} -> ${nextProps.pokemon.name}`);
    if (pokemonTypesChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - Pokemon Types changed`);
    if (isRankedChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - IsRanked: ${prevIsRanked} -> ${nextIsRanked}`);
    if (currentRankChanged) console.log(`🔍 [CARD_MEMO_DEBUG] - CurrentRank: ${prevCurrentRank} -> ${nextCurrentRank}`);
  } else {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${nextProps.pokemon.name}: No prop changes - PREVENTING RE-RENDER`);
  }
  
  return !shouldUpdate; // Return true to prevent re-render when props haven't changed
});

DraggablePokemonMilestoneCard.displayName = 'DraggablePokemonMilestoneCard';

export default DraggablePokemonMilestoneCard;
