
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
  // CRITICAL: Add debugging to track which path is taken
  console.log(`🔍 [CARD_DEBUG] OptimizedDraggableCard - ${pokemon.name} - context: ${context}`);
  
  // CRITICAL FIX: Pure conditional component rendering - NO HOOKS in this component
  if (context === 'available') {
    console.log(`🔍 [CARD_DEBUG] Rendering DraggableAvailableCard for ${pokemon.name}`);
    return (
      <DraggableAvailableCard
        pokemon={pokemon}
        index={index}
        isPending={isPending}
        showRank={showRank}
        isDraggable={isDraggable}
      />
    );
  }

  console.log(`🔍 [CARD_DEBUG] Rendering SortableRankedCard for ${pokemon.name}`);
  return (
    <SortableRankedCard
      pokemon={pokemon}
      index={index}
      isPending={isPending}
      showRank={showRank}
      isDraggable={isDraggable}
    />
  );
});

OptimizedDraggableCard.displayName = 'OptimizedDraggableCard';

export default OptimizedDraggableCard;
