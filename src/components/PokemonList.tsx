
import React from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
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
              <Draggable key={pokemon.id} draggableId={pokemon.id.toString()} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`flex flex-col relative ${
                      snapshot.isDragging 
                        ? "z-50 transform rotate-3 scale-105 shadow-2xl" 
                        : "hover:shadow-md transition-shadow duration-200"
                    }`}
                  >
                    <PokemonCard
                      pokemon={pokemon}
                      compact={true}
                      viewMode="grid"
                      isDragging={snapshot.isDragging}
                    />
                    {isRankingArea && (
                      <div className={`text-center mt-1 font-bold text-sm px-2 py-1 rounded-full ${
                        index < 3 
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900" 
                          : index < 10 
                          ? "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800"
                          : "bg-gradient-to-r from-orange-300 to-orange-500 text-orange-900"
                      }`}>
                        #{index + 1}
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default PokemonList;
