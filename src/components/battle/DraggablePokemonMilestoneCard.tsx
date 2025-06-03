
import React, { useMemo, useCallback } from "react";
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

const DraggablePokemonMilestoneCard: React.FC<DraggablePokemonMilestoneCardProps> = React.memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = 'ranked'
}) => {
  console.log(`🃏 [MILESTONE_CARD_OPTIMIZED] Rendering card for ${pokemon.name} (${pokemon.id})`);

  const [isOpen, setIsOpen] = React.useState(false);

  // All memoized computations with stable dependencies
  const isRankedPokemon = useMemo(() => 
    context === 'available' && 'isRanked' in pokemon && Boolean(pokemon.isRanked), 
    [context, pokemon]
  );
  
  const currentRank = useMemo(() => 
    isRankedPokemon && 'currentRank' in pokemon ? Number(pokemon.currentRank) || null : null, 
    [isRankedPokemon, pokemon]
  );

  const sortableId = useMemo(() => 
    isDraggable ? (isAvailable ? `available-${pokemon.id}` : pokemon.id) : `static-${pokemon.id}`, 
    [isDraggable, isAvailable, pokemon.id]
  );

  const sortableData = useMemo(() => ({
    type: context === 'available' ? 'available-pokemon' : 'ranked-pokemon',
    pokemon: pokemon,
    source: context,
    index,
    isRanked: isRankedPokemon
  }), [context, pokemon, index, isRankedPokemon]);

  // Only use sortable if draggable AND modal is not open
  const sortableResult = useSortable({ 
    id: sortableId,
    disabled: !isDraggable || isOpen,
    data: sortableData
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortableResult;

  // Stable style computation
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    minHeight: '140px',
    minWidth: '140px',
    zIndex: isDragging ? 1000 : 'auto',
    cursor: isDraggable && !isOpen ? 'grab' : 'default'
  }), [transform, isDragging, transition, isDraggable, isOpen]);

  const backgroundColorClass = useMemo(() => 
    getPokemonBackgroundColor(pokemon), 
    [pokemon]
  );

  // Hooks for modal content - only when modal is open
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, error: tcgError, hasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);

  // Stable modal content flags
  const modalFlags = useMemo(() => ({
    showLoading: Boolean(isLoadingTCG),
    showTCGCards: Boolean(!isLoadingTCG && hasTcgCard && tcgCard !== null),
    showFallbackInfo: Boolean(!isLoadingTCG && !hasTcgCard)
  }), [isLoadingTCG, hasTcgCard, tcgCard]);

  // Stable drag props
  const dragProps = useMemo(() => 
    isDraggable && !isOpen ? { ...attributes, ...listeners } : {}, 
    [isDraggable, isOpen, attributes, listeners]
  );

  // Stable CSS classes
  const containerClasses = useMemo(() => {
    const baseClasses = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group`;
    const interactionClasses = isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : '';
    const stateClasses = isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400 transform-gpu' : 'hover:shadow-lg transition-all duration-200';
    const pendingClasses = isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
    
    return `${baseClasses} ${interactionClasses} ${stateClasses} ${pendingClasses}`.trim();
  }, [backgroundColorClass, isDraggable, isOpen, isDragging, isPending]);

  const handleSetIsOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={containerClasses}
      {...dragProps}
    >
      <PokemonMilestoneOverlays
        context={context}
        isRankedPokemon={isRankedPokemon}
        currentRank={currentRank}
        isPending={isPending}
        showRank={showRank}
        index={index}
        isDragging={isDragging}
      />

      <PokemonInfoButton
        pokemon={pokemon}
        isOpen={isOpen}
        setIsOpen={handleSetIsOpen}
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
  // Aggressive custom comparison for maximum render prevention
  return (
    prevProps.pokemon.id === nextProps.pokemon.id &&
    prevProps.pokemon.name === nextProps.pokemon.name &&
    prevProps.index === nextProps.index &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.showRank === nextProps.showRank &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.isAvailable === nextProps.isAvailable &&
    prevProps.context === nextProps.context &&
    // Check score changes for ranked pokemon
    (('score' in prevProps.pokemon && 'score' in nextProps.pokemon) ? 
      Math.abs(prevProps.pokemon.score - nextProps.pokemon.score) < 0.001 : true)
  );
});

DraggablePokemonMilestoneCard.displayName = 'DraggablePokemonMilestoneCard';

export default DraggablePokemonMilestoneCard;
