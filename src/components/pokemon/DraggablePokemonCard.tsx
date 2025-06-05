
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Pokemon } from '@/services/pokemon';
import PokemonCard from './PokemonCard';

interface DraggablePokemonCardProps {
  pokemon: Pokemon;
  compact?: boolean;
  viewMode?: 'grid' | 'list';
}

const DraggablePokemonCard: React.FC<DraggablePokemonCardProps> = ({
  pokemon,
  compact = true,
  viewMode = 'grid'
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({
    id: `available-${pokemon.id}`,
  });

  console.log(`[INIT] Draggable Pokemon initialized: ${pokemon.id}`);

  const style = transform
    ? { 
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, 
        transition,
        zIndex: isDragging ? 1000 : 'auto'
      }
    : {};

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <PokemonCard
        pokemon={pokemon}
        compact={compact}
        viewMode={viewMode}
        isDragging={isDragging}
      />
    </div>
  );
};

export default DraggablePokemonCard;
