
import React, { memo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import OptimizedDraggableCard from "./OptimizedDraggableCard";

interface DraggableAvailableCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
  showRank?: boolean;
  isDraggable?: boolean;
}

const DraggableAvailableCard: React.FC<DraggableAvailableCardProps> = memo(({ 
  pokemon, 
  index, 
  isPending = false,
  showRank = true,
  isDraggable = true
}) => {
  console.log(`🔍 [DRAGGABLE_AVAILABLE_CARD] Rendering for ${pokemon.name}`);
  
  // CRITICAL FIX: Always render OptimizedDraggableCard to maintain consistent hooks
  return (
    <OptimizedDraggableCard
      pokemon={pokemon}
      index={index}
      isPending={isPending}
      showRank={showRank}
      isDraggable={isDraggable}
      context="available"
    />
  );
});

DraggableAvailableCard.displayName = 'DraggableAvailableCard';

export default DraggableAvailableCard;
