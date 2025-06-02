
import React from "react";
import { useDraggable } from '@dnd-kit/core';
import { UnifiedPokemonCard } from "./UnifiedPokemonCard";

interface EnhancedPokemon {
  id: number;
  name: string;
  image: string;
  types?: string[];
  isRanked: boolean;
  currentRank: number | null;
  score: number;
  count: number;
  confidence: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface EnhancedAvailablePokemonCardProps {
  pokemon: EnhancedPokemon;
}

export const EnhancedAvailablePokemonCard: React.FC<EnhancedAvailablePokemonCardProps> = React.memo(({
  pokemon
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `available-${pokemon.id}`,
    data: {
      type: 'available-pokemon',
      pokemon: pokemon,
      isRanked: pokemon.isRanked
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative cursor-grab active:cursor-grabbing transition-all duration-200
        ${isDragging ? 'opacity-50 scale-105 z-50' : 'hover:scale-102 hover:shadow-lg'}
      `}
    >
      <UnifiedPokemonCard
        pokemon={pokemon}
        isRanked={pokemon.isRanked}
        showScore={pokemon.isRanked}
      />
    </div>
  );
});

EnhancedAvailablePokemonCard.displayName = 'EnhancedAvailablePokemonCard';
