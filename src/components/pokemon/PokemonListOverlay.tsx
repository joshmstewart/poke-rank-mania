
import React from "react";
import { useDroppable } from '@dnd-kit/core';

interface PokemonListOverlayProps {
  droppableId: string;
  isRankingArea: boolean;
}

const PokemonListOverlay: React.FC<PokemonListOverlayProps> = ({
  droppableId,
  isRankingArea
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${droppableId}-overlay`,
    data: {
      type: isRankingArea ? 'ranking-overlay' : 'available-overlay',
      accepts: ['pokemon-card']
    }
  });

  if (!isRankingArea) return null;

  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-0 z-0 ${isOver ? 'bg-green-100/50' : ''}`}
      style={{ 
        display: isOver ? 'block' : 'none',
        pointerEvents: isOver ? 'auto' : 'none'
      }}
    />
  );
};

export default PokemonListOverlay;
