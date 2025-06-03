
import React, { useMemo, useCallback } from "react";
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
  // Track renders for performance debugging
  useRenderTracker('DraggablePokemonMilestoneCard', { 
    pokemonId: pokemon.id,
    isPending,
    isDraggable 
  });

  const [isOpen, setIsOpen] = React.useState(false);

  // Memoize computed values
  const isRankedPokemon = useMemo(() => 
    context === 'available' && 'isRanked' in pokemon && pokemon.isRanked, [context, pokemon]);
  
  const currentRank = useMemo(() => 
    isRankedPokemon && 'currentRank' in pokemon ? pokemon.currentRank : null, [isRankedPokemon, pokemon]);

  const sortableId = useMemo(() => 
    isDraggable ? (isAvailable ? `available-${pokemon.id}` : pokemon.id) : `static-${pokemon.id}`, 
    [isDraggable, isAvailable, pokemon.id]);

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

  // Memoize drag styling
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    minHeight: '140px',
    minWidth: '140px',
    zIndex: isDragging ? 1000 : 'auto',
    cursor: isDraggable && !isOpen ? 'grab' : 'default'
  }), [transform, isDragging, transition, isDraggable, isOpen]);

  const backgroundColorClass = useMemo(() => 
    getPokemonBackgroundColor(pokemon), [pokemon]);

  // Hooks for modal content
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, error: tcgError, hasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);

  // Memoize modal content flags
  const showLoading = isLoadingTCG;
  const showTCGCards = !isLoadingTCG && hasTcgCard && tcgCard !== null;
  const showFallbackInfo = !isLoadingTCG && !hasTcgCard;

  // Memoize drag/listener props
  const dragProps = useMemo(() => 
    isDraggable && !isOpen ? { ...attributes, ...listeners } : {}, 
    [isDraggable, isOpen, attributes, listeners]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-35 flex flex-col group ${
        isDraggable && !isOpen ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging ? 'opacity-80 scale-105 shadow-2xl border-blue-400 transform-gpu' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
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
        setIsOpen={setIsOpen}
        isDragging={isDragging}
        showLoading={showLoading}
        showTCGCards={showTCGCards}
        showFallbackInfo={showFallbackInfo}
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
});

DraggablePokemonMilestoneCard.displayName = 'DraggablePokemonMilestoneCard';

export default DraggablePokemonMilestoneCard;
