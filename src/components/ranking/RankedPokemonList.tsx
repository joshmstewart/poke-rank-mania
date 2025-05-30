
import React from "react";
import { RankedPokemon } from "@/services/pokemon";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableRankedPokemonCard from "./SortableRankedPokemonCard";

interface RankedPokemonListProps {
  rankedPokemon: RankedPokemon[];
  pendingRefinements: Set<number>;
}

const RankedPokemonList: React.FC<RankedPokemonListProps> = ({
  rankedPokemon,
  pendingRefinements
}) => {
  const { setNodeRef } = useDroppable({
    id: 'ranked-droppable'
  });

  if (rankedPokemon.length === 0) {
    return (
      <div 
        ref={setNodeRef}
        className="min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8"
      >
        <p className="text-gray-500 text-center">
          Drag Pokemon here to start ranking them
        </p>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} className="space-y-2">
      <SortableContext 
        items={rankedPokemon.map((_, idx) => `ranked-${idx}`)}
        strategy={verticalListSortingStrategy}
      >
        {rankedPokemon.map((pokemon, index) => (
          <SortableRankedPokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            rank={index + 1}
            sortableId={`ranked-${index}`}
            isPending={pendingRefinements.has(pokemon.id)}
          />
        ))}
      </SortableContext>
    </div>
  );
};

export default RankedPokemonList;
