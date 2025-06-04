
import React from "react";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggablePokemonCard from "./DraggablePokemonCard";
import { Pokemon } from "@/services/pokemon";

interface PokemonListProps {
  title: string;
  pokemonList: Pokemon[];
  droppableId: string;
  isRankingArea?: boolean;
}

const PokemonList: React.FC<PokemonListProps> = ({
  title,
  pokemonList,
  droppableId,
  isRankingArea = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: isRankingArea ? 'ranking-container' : 'available-container',
      accepts: ['pokemon-card']
    }
  });

  // Create sortable items array for SortableContext
  const sortableItems = pokemonList.map(pokemon => pokemon.id.toString());

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-1 ${
        isOver ? "bg-blue-50 border-2 border-blue-300" : ""
      }`}
    >
      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-3 gap-1">
          {pokemonList.map((pokemon, index) => (
            <DraggablePokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              index={index}
              isRankingArea={isRankingArea}
              showRank={isRankingArea}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default PokemonList;
