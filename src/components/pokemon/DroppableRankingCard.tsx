
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from '@/services/pokemon';
import PokemonCard from './PokemonCard';

interface DroppableRankingCardProps {
  pokemon?: Pokemon | RankedPokemon;
  rank: number;
  showRank?: boolean;
}

const DroppableRankingCard: React.FC<DroppableRankingCardProps> = ({
  pokemon,
  rank,
  showRank = true
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `ranking-${rank}`,
  });

  console.log(`[INIT] Droppable rank initialized: ranking-${rank}`);

  const style = {
    backgroundColor: isOver ? '#e0f2fe' : 'transparent',
    border: isOver ? '2px dashed #0284c7' : '2px dashed transparent',
    minHeight: pokemon ? 'auto' : '120px',
  };

  if (!pokemon) {
    return (
      <div 
        ref={setNodeRef} 
        style={style}
        className="rounded-lg p-4 flex items-center justify-center text-gray-400 text-sm transition-all duration-200"
      >
        Drop here for rank #{rank + 1}
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg transition-all duration-200">
      <PokemonCard
        pokemon={pokemon}
        compact={true}
        viewMode="grid"
        isDragging={false}
      />
      {showRank && (
        <div className="text-center mt-1">
          <div className="inline-block bg-white border-2 border-gray-800 text-gray-900 font-bold text-sm px-2 py-1 rounded-md shadow-sm">
            #{rank + 1}
          </div>
        </div>
      )}
    </div>
  );
};

export default DroppableRankingCard;
