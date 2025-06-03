
import React, { useMemo, useCallback, memo } from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import { useRenderTracker } from "@/hooks/battle/useRenderTracker";
import PokemonMilestoneImage from "@/components/pokemon/PokemonMilestoneImage";
import PokemonInfoButton from "@/components/pokemon/PokemonInfoButton";
import PokemonMilestoneInfo from "@/components/pokemon/PokemonMilestoneInfo";
import PokemonMilestoneOverlays from "@/components/pokemon/PokemonMilestoneOverlays";

interface DraggablePokemonMilestoneCardOptimizedProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
  context?: 'available' | 'ranked';
}

// Memoized stable style object to prevent recreation
const createCardStyle = (transform: any, isDragging: boolean, transition: any, isDraggable: boolean, isOpen: boolean) => ({
  transform: CSS.Transform.toString(transform),
  transition: isDragging ? 'none' : transition,
  minHeight: '140px',
  minWidth: '140px',
  zIndex: isDragging ? 1000 : 'auto',
  cursor: isDraggable && !isOpen ? 'grab' : 'default'
});

const DraggablePokemonMilestoneCardOptimized: React.FC<DraggablePokemonMilestoneCardOptimizedProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = 'ranked'
}) => {
  // Track renders for performance debugging
  useRenderTracker('DraggablePokemonMilestoneCardOptimized', { 
    pokemonId: pokemon.id,
    isPending,
    isDraggable 
  });

  const [isOpen, setIsOpen] = React.useState(false);

  // Memoize computed values with stable dependencies
  const computedValues = useMemo(() => {
    const isRankedPokemon = context === 'available' && 'isRanked' in pokemon && pokemon.isRanked;
    const currentRank = isRankedPokemon && 'currentRank' in pokemon ? pokemon.currentRank : null;
    const sortableId = isDraggable ? (isAvailable ? `available-${pokemon.id}` : pokemon.id) : `static-${pokemon.id}`;
    
    return {
      isRankedPokemon,
      currentRank,
      sortableId
    };
  }, [context, pokemon, isDraggable, isAvailable]);

  // Memoize sortable data to prevent recreation
  const sortableData = useMemo(() => ({
    type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
    pokemon: pokemon,
    source: context,
    index,
    isRanked: computedValues.isRankedPokemon
  }), [context, pokemon, index, computedValues.isRankedPokemon]);

  // Memoize sortable config to prevent recreation
  const sortableConfig = useMemo(() => ({ 
    id: computedValues.sortableId,
    disabled: !isDraggable || isOpen,
    data: sortableData
  }), [computedValues.sortableId, isDraggable, isOpen, sortableData]);

  const sortableResult = useSortable(sortableConfig);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortableResult;

  // Memoize style calculation to prevent recreation
  const style = useMemo(() => 
    createCardStyle(transform, isDragging, transition, isDraggable, isOpen),
    [transform, isDragging, transition, isDraggable, isOpen]
  );

  // Memoize background color to prevent recalculation
  const backgroundColorClass = useMemo(() => 
    getPokemonBackgroundColor(pokemon), [pokemon]);

  // Hooks for modal content - only load when modal is open
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, error: tcgError, hasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);

  // Memoize modal content flags
  const modalFlags = useMemo(() => ({
    showLoading: isLoadingTCG,
    showTCGCards: !isLoadingTCG && hasTcgCard && tcgCard !== null,
    showFallbackInfo: !isLoadingTCG && !hasTcgCard
  }), [isLoadingTCG, hasTcgCard, tcgCard]);

  // Memoize drag/listener props to prevent recreation
  const dragProps = useMemo(() => 
    isDraggable && !isOpen ? { ...attributes, ...listeners } : {}, 
    [isDraggable, isOpen, attributes, listeners]
  );

  // Memoize class names to prevent recreation
  const cardClassName = useMemo(() => {
    const baseClasses = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group`;
    const cursorClass = isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : '';
    const dragState = isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400 transform-gpu' : 'hover:shadow-lg transition-all duration-200';
    const pendingState = isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
    
    return `${baseClasses} ${cursorClass} ${dragState} ${pendingState}`;
  }, [backgroundColorClass, isDraggable, isOpen, isDragging, isPending]);

  // Memoize stable callback for setIsOpen
  const handleToggleModal = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
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
  // Custom comparison for optimal re-render prevention
  return (
    prevProps.pokemon.id === nextProps.pokemon.id &&
    prevProps.index === nextProps.index &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.showRank === nextProps.showRank &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.isAvailable === nextProps.isAvailable &&
    prevProps.context === nextProps.context
  );
});

DraggablePokemonMilestoneCardOptimized.displayName = 'DraggablePokemonMilestoneCardOptimized';

export default DraggablePokemonMilestoneCardOptimized;
