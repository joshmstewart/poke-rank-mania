
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

  const handleClick = (e: React.MouseEvent) => {
    console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] Click on ${pokemon.name}`);
    // Don't prevent default here - let the info button handle its own events
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] 🎯 POINTER DOWN on ${pokemon.name}`);
    console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] - Event target:`, e.target);
    console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] - Current target:`, e.currentTarget);
    
    // Check if clicking on info button
    const target = e.target as HTMLElement;
    if (target.closest('[data-info-button="true"]') || target.textContent === 'i') {
      console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] ❌ Clicked on info button - not starting drag`);
      e.stopPropagation();
      return;
    }
    
    console.log(`🔍🔍🔍 [DRAGGABLE_AVAILABLE_DEBUG] ✅ Valid drag start - calling listeners`);
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl' : 'hover:shadow-lg transition-all duration-200'
      }`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      {...attributes}
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
