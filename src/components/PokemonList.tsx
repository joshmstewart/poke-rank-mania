
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
          <div className="grid grid-cols-3 gap-1 p-1">
            {pokemonList.map((pokemon, index) => (
              <div key={pokemon.id} className="flex flex-col">
                <PokemonCard
                  pokemon={pokemon}
                  compact={true}
                  viewMode="grid"
                />
                {isRankingArea && (
                  <div className="text-center text-xs text-gray-500 mt-1">
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
