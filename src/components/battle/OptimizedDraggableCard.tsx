
import React, { memo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import UnifiedPokemonCard from "./UnifiedPokemonCard";

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
  console.log(`🔍 [OPTIMIZED_CARD_DEBUG] OptimizedDraggableCard - ${pokemon.name} - context: ${context}`);
  
  // CRITICAL FIX: No conditional rendering - always render the same component
  return (
    <UnifiedPokemonCard
      pokemon={pokemon}
      index={index}
      isPending={isPending}
      showRank={showRank}
      isDraggable={isDraggable}
      context={context}
    />
  );
});

OptimizedDraggableCard.displayName = 'OptimizedDraggableCard';

export default OptimizedDraggableCard;
