
import React from "react";
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";
import { Pokemon, RankedPokemon } from "@/services/pokemon";

interface MemoizedPokemonCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  isAvailable?: boolean;
  context?: 'available' | 'ranked';
  isBeingDragged?: boolean;
}

const MemoizedPokemonCard: React.FC<MemoizedPokemonCardProps> = React.memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  isAvailable = false,
  context = 'ranked',
  isBeingDragged = false
}) => {
  return (
    <DraggablePokemonMilestoneCard
      pokemon={pokemon}
      index={index}
      isPending={isPending}
      showRank={showRank}
      isDraggable={isDraggable}
      isAvailable={isAvailable}
      context={context}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization during drag
  // Only re-render if essential props change or if this card is being dragged
  return (
    prevProps.pokemon.id === nextProps.pokemon.id &&
    prevProps.index === nextProps.index &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.showRank === nextProps.showRank &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.isAvailable === nextProps.isAvailable &&
    prevProps.context === nextProps.context &&
    prevProps.isBeingDragged === nextProps.isBeingDragged &&
    // Only re-render if score changes significantly (for ranked Pokemon)
    (
      !('score' in prevProps.pokemon) || 
      !('score' in nextProps.pokemon) ||
      Math.abs(prevProps.pokemon.score - nextProps.pokemon.score) < 0.001
    )
  );
});

MemoizedPokemonCard.displayName = 'MemoizedPokemonCard';

export default MemoizedPokemonCard;
