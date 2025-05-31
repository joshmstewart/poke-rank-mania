
import React from "react";
import { useDraggable } from '@dnd-kit/core';
import { Pokemon } from "@/services/pokemon";
import PokemonCard from "@/components/PokemonCard";

interface DraggableAvailablePokemonCardProps {
  pokemon: Pokemon;
}

const DraggableAvailablePokemonCard: React.FC<DraggableAvailablePokemonCardProps> = ({ 
  pokemon
}) => {
  console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] Setting up draggable for ${pokemon.name} (ID: ${pokemon.id})`);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `available-${pokemon.id}`,
    data: {
      pokemon,
      source: 'available',
      type: 'available-pokemon'
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] ${pokemon.name}:`);
  console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] - isDragging: ${isDragging}`);
  console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] - listeners exists: ${!!listeners}`);
  console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] - transform:`, transform);
  console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] - attributes:`, attributes);

  // CRITICAL FIX: Remove click and pointer handlers that interfere with info buttons
  // Let the card handle its own events naturally

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl' : 'hover:shadow-lg transition-all duration-200'
      }`}
      {...attributes}
      {...listeners}
    >
      <PokemonCard 
        pokemon={pokemon}
        viewMode="grid"
        compact={true}
        isDragging={isDragging}
      />
    </div>
  );
};

export default DraggableAvailablePokemonCard;
