
import React from "react";
import { Droppable } from "react-beautiful-dnd";
import PokemonCard from "./PokemonCard";
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
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-h-[100px] ${
            snapshot.isDraggingOver ? "bg-blue-50" : ""
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
            {pokemonList.map((pokemon, index) => (
              <div key={pokemon.id}>
                <PokemonCard
                  pokemon={pokemon}
                  compact={true}
                />
                {isRankingArea && (
                  <div className="text-center text-xs text-gray-500 mt-0.5">
                    #{index + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default PokemonList;
