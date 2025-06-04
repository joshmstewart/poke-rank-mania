
import React, { memo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import SortableRankedCard from "./SortableRankedCard";
import DraggableAvailableCard from "./DraggableAvailableCard";

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
  console.log(`🔍 [OPTIMIZED_CARD_ROUTER] Routing ${pokemon.name} to ${context} component`);
  
  // CRITICAL FIX: Render different components based on context, NEVER call hooks conditionally
  if (context === 'available') {
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
