
import React, { useMemo, useCallback, memo, useState, useRef, useEffect } from "react";
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
let globalRenderCount = 0;

// Type guard to check if pokemon is RankedPokemon
const isRankedPokemon = (pokemon: Pokemon | RankedPokemon): pokemon is RankedPokemon => {
  return 'score' in pokemon;
};

// CRITICAL: Separate the core component logic from the memo wrapper
const DraggablePokemonMilestoneCardCore: React.FC<DraggablePokemonMilestoneCardProps> = ({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = 'ranked'
}) => {
  globalRenderCount++;
  const renderStartTime = performance.now();
  
  // CRITICAL: Detailed render logging with component instance tracking
  const componentId = useRef(`${pokemon.name}-${pokemon.id}-${context}`);
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name} (ID: ${pokemon.id}): Render #${renderCountRef.current} STARTED`);
  console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name}: Component context=${context}, index=${index}, isPending=${isPending}`);

  // CRITICAL: Track what might be causing renders beyond props
  const [isOpen, setIsOpen] = useState(false);
  
  // Log state changes that could cause renders
  useEffect(() => {
    console.log(`🔍 [CARD_STATE_DEBUG] ${pokemon.name}: isOpen state changed to ${isOpen}`);
  }, [isOpen, pokemon.name]);

  // Memoize computed values with very specific dependencies
  const computedValues = useMemo(() => {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemon.name}: Computing computed values`);
    
    // Safe property access with type guards
    const hasIsRankedProperty = 'isRanked' in pokemon;
    const isRankedValue = hasIsRankedProperty ? Boolean((pokemon as any).isRanked) : false;
    const isRanked = context === 'available' && isRankedValue;
    
    const hasCurrentRankProperty = 'currentRank' in pokemon;
    const currentRankValue = hasCurrentRankProperty ? (pokemon as any).currentRank : null;
    const currentRank = (isRanked && typeof currentRankValue === 'number') ? currentRankValue : null;
    
    const sortableId = isDraggable ? (isAvailable ? `available-${pokemon.id}` : pokemon.id) : `static-${pokemon.id}`;
    
    return {
      isRankedPokemon: isRanked,
      currentRank,
      sortableId
    };
  }, [
    context, 
    pokemon.id, 
    // CRITICAL: Only depend on the actual property values, not complex object lookups
    'isRanked' in pokemon ? (pokemon as any).isRanked : false,
    'currentRank' in pokemon ? (pokemon as any).currentRank : null,
    isDraggable, 
    isAvailable
  ]);

  // Stable sortable configuration
  const sortableConfig = useMemo(() => {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemon.name}: Computing sortable config`);
    
    return { 
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
  }, [
    computedValues.sortableId, 
    isDraggable, 
    isOpen, 
    context, 
    pokemon.id,  // Only pokemon.id, not the whole pokemon object
    pokemon.name, // Only pokemon.name, not the whole pokemon object
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
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemon.name}: Computing card style, isDragging=${isDragging}`);
    
    return {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? 'none' : transition,
      minHeight: '140px',
      minWidth: '140px',
      zIndex: isDragging ? 1000 : 'auto',
      cursor: isDraggable && !isOpen ? 'grab' : 'default'
    };
  }, [transform, isDragging, transition, isDraggable, isOpen]);

  // Memoize background color based only on pokemon types
  const backgroundColorClass = useMemo(() => {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemon.name}: Computing background color`);
    return getPokemonBackgroundColor(pokemon);
  }, [pokemon.types?.join(',') || '', pokemon.id]);

  // Conditional hooks - only when modal is open
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, error: tcgError, hasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);

  // Memoize modal flags
  const modalFlags = useMemo(() => {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemon.name}: Computing modal flags, isOpen=${isOpen}`);
    
    return {
      showLoading: isLoadingTCG,
      showTCGCards: !isLoadingTCG && hasTcgCard && tcgCard !== null,
      showFallbackInfo: !isLoadingTCG && !hasTcgCard
    };
  }, [isLoadingTCG, hasTcgCard, tcgCard]);

  // Memoize drag props
  const dragProps = useMemo(() => {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemon.name}: Computing drag props`);
    return isDraggable && !isOpen ? { ...attributes, ...listeners } : {};
  }, [isDraggable, isOpen, attributes, listeners]);

  // Memoize className
  const cardClassName = useMemo(() => {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemon.name}: Computing card className`);
    
    const baseClasses = `${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group`;
    const cursorClass = isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : '';
    const dragState = isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400 transform-gpu' : 'hover:shadow-lg transition-all duration-200';
    const pendingState = isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
    
    return `${baseClasses} ${cursorClass} ${dragState} ${pendingState}`;
  }, [backgroundColorClass, isDraggable, isOpen, isDragging, isPending]);

  // Stable callback for modal toggle
  const handleToggleModal = useCallback((open: boolean) => {
    console.log(`🔍 [CARD_INTERACTION_DEBUG] ${pokemon.name}: Modal toggle to ${open}`);
    setIsOpen(open);
  }, [pokemon.name]);

  const renderEndTime = performance.now();
  console.log(`🔍 [CARD_RENDER_DEBUG] ${pokemon.name} (ID: ${pokemon.id}): Render #${renderCountRef.current} COMPLETED (${(renderEndTime - renderStartTime).toFixed(2)}ms)`);

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
};

// CRITICAL: Enhanced memo comparison with comprehensive logging
const DraggablePokemonMilestoneCard = memo(DraggablePokemonMilestoneCardCore, (prevProps, nextProps) => {
  const pokemonName = nextProps.pokemon.name;
  console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemonName}: Starting memo comparison`);

  // Create detailed change tracking
  const changes: string[] = [];
  
  // Check each prop individually with detailed logging
  if (prevProps.pokemon.id !== nextProps.pokemon.id) {
    changes.push(`pokemon.id: ${prevProps.pokemon.id} → ${nextProps.pokemon.id}`);
  }
  
  if (prevProps.pokemon.name !== nextProps.pokemon.name) {
    changes.push(`pokemon.name: ${prevProps.pokemon.name} → ${nextProps.pokemon.name}`);
  }
  
  if (prevProps.index !== nextProps.index) {
    changes.push(`index: ${prevProps.index} → ${nextProps.index}`);
  }
  
  if (prevProps.isPending !== nextProps.isPending) {
    changes.push(`isPending: ${prevProps.isPending} → ${nextProps.isPending}`);
  }
  
  if (prevProps.showRank !== nextProps.showRank) {
    changes.push(`showRank: ${prevProps.showRank} → ${nextProps.showRank}`);
  }
  
  if (prevProps.isDraggable !== nextProps.isDraggable) {
    changes.push(`isDraggable: ${prevProps.isDraggable} → ${nextProps.isDraggable}`);
  }
  
  if (prevProps.isAvailable !== nextProps.isAvailable) {
    changes.push(`isAvailable: ${prevProps.isAvailable} → ${nextProps.isAvailable}`);
  }
  
  if (prevProps.context !== nextProps.context) {
    changes.push(`context: ${prevProps.context} → ${nextProps.context}`);
  }
  
  // Check Pokemon types (shallow comparison)
  const prevTypes = JSON.stringify(prevProps.pokemon.types || []);
  const nextTypes = JSON.stringify(nextProps.pokemon.types || []);
  if (prevTypes !== nextTypes) {
    changes.push(`pokemon.types: ${prevTypes} → ${nextTypes}`);
  }
  
  // Check for isRanked and currentRank if they exist
  const prevIsRanked = 'isRanked' in prevProps.pokemon ? (prevProps.pokemon as any).isRanked : undefined;
  const nextIsRanked = 'isRanked' in nextProps.pokemon ? (nextProps.pokemon as any).isRanked : undefined;
  if (prevIsRanked !== nextIsRanked) {
    changes.push(`pokemon.isRanked: ${prevIsRanked} → ${nextIsRanked}`);
  }
  
  const prevCurrentRank = 'currentRank' in prevProps.pokemon ? (prevProps.pokemon as any).currentRank : undefined;
  const nextCurrentRank = 'currentRank' in nextProps.pokemon ? (nextProps.pokemon as any).currentRank : undefined;
  if (prevCurrentRank !== nextCurrentRank) {
    changes.push(`pokemon.currentRank: ${prevCurrentRank} → ${nextCurrentRank}`);
  }

  const shouldUpdate = changes.length > 0;
  
  if (shouldUpdate) {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemonName}: Props changed - ALLOWING RE-RENDER`);
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemonName}: Changes detected:`, changes);
    return false; // Allow re-render
  } else {
    console.log(`🔍 [CARD_MEMO_DEBUG] ${pokemonName}: No prop changes - PREVENTING RE-RENDER`);
    return true; // Prevent re-render
  }
});

DraggablePokemonMilestoneCard.displayName = 'DraggablePokemonMilestoneCard';

export default DraggablePokemonMilestoneCard;
