
import React, { memo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import OptimizedDraggableCard from "./OptimizedDraggableCard";

interface SortableRankedCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
}

const SortableRankedCard: React.FC<SortableRankedCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true
}) => {
  console.log(`🔍 [SORTABLE_RANKED_CARD] Rendering for ${pokemon.name}`);
  
  // CRITICAL FIX: Always render OptimizedDraggableCard to maintain consistent hooks
  return (
    <OptimizedDraggableCard
      pokemon={pokemon}
      index={index}
      isPending={isPending}
      showRank={showRank}
      isDraggable={isDraggable}
      context="ranked"
    />
  );
});

SortableRankedCard.displayName = 'SortableRankedCard';

export default SortableRankedCard;
