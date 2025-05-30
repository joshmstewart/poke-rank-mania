
import React from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useSortable, useDroppable } from '@dnd-kit/core';
import { formatPokemonName } from "@/utils/pokemon";

interface SortableRankedPokemonCardProps {
  pokemon: RankedPokemon;
  rank: number;
  sortableId: string;
  isPending: boolean;
}

const SortableRankedPokemonCard: React.FC<SortableRankedPokemonCardProps> = ({
  pokemon,
  rank,
  sortableId,
  isPending
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: sortableId,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-4 border rounded-lg bg-white shadow-sm cursor-grab transition-all
        hover:shadow-md hover:border-blue-300
        ${isDragging ? 'opacity-50 cursor-grabbing z-50' : ''}
        ${isPending ? 'border-orange-300 bg-orange-50' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-lg font-bold text-gray-600 min-w-[2rem]">
            #{rank}
          </div>
          <img 
            src={pokemon.image} 
            alt={pokemon.name}
            className="w-16 h-16 object-contain"
          />
          <div>
            <h4 className="font-semibold">{formatPokemonName(pokemon.name)}</h4>
            <p className="text-sm text-gray-500">#{pokemon.id}</p>
          </div>
        </div>
        
        <div className="text-right space-y-1">
          <div className="text-sm font-medium">
            Score: {pokemon.score.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">
            Confidence: {pokemon.confidence.toFixed(0)}%
          </div>
          {isPending && (
            <div className="text-xs text-orange-600 font-medium">
              Updating...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SortableRankedPokemonCard;
