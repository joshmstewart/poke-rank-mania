
import React, { memo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggableAvailableCard from "./DraggableAvailableCard";
import SortableRankedCard from "./SortableRankedCard";

interface OptimizedDraggableCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
  context?: 'available' | 'ranked';
}

const OptimizedDraggableCard: React.FC<OptimizedDraggableCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true,
  context = 'ranked'
}) => {
  // CRITICAL FIX: Conditional component rendering instead of conditional hooks
  // This ensures hooks are NEVER called conditionally
  return context === 'available' 
    ? (
        <DraggableAvailableCard
          pokemon={pokemon}
          index={index}
          isPending={isPending}
          showRank={showRank}
          isDraggable={isDraggable}
        />
      )
    : (
        <SortableRankedCard
          pokemon={pokemon}
          index={index}
          isPending={isPending}
          showRank={showRank}
          isDraggable={isDraggable}
        />
      );
}, (prevProps, nextProps) => {
  // Efficient prop comparison to prevent unnecessary re-renders
  return (
    prevProps.pokemon.id === nextProps.pokemon.id &&
    prevProps.index === nextProps.index &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.showRank === nextProps.showRank &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.context === nextProps.context
  );
});

OptimizedDraggableCard.displayName = 'OptimizedDraggableCard';

export default OptimizedDraggableCard;
