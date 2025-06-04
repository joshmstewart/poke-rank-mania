
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PokemonCard from "./PokemonCard";
import { Pokemon } from "@/services/pokemon";

interface DraggablePokemonCardProps {
  pokemon: Pokemon;
  index: number;
  isRankingArea?: boolean;
  showRank?: boolean;
}

const DraggablePokemonCard: React.FC<DraggablePokemonCardProps> = ({
  pokemon,
  index,
  isRankingArea = false,
  showRank = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: pokemon.id.toString(),
    data: {
      type: 'pokemon-card',
      pokemon: pokemon,
      index: index,
      isRankingArea: isRankingArea
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${
        isDragging 
          ? "z-50 transform rotate-2 scale-105 shadow-2xl opacity-90" 
          : "hover:shadow-md transition-shadow duration-200"
      }`}
    >
      <PokemonCard
        pokemon={pokemon}
        compact={true}
        viewMode="grid"
        isDragging={isDragging}
      />
      {showRank && (
        <div className="text-center mt-1">
          <div className="inline-block bg-white border-2 border-gray-800 text-gray-900 font-bold text-sm px-2 py-1 rounded-md shadow-sm">
            #{index + 1}
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggablePokemonCard;
