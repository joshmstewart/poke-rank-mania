
import React, { useState } from "react";
import { Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import PokemonCard from "./PokemonCard";
import { Pokemon } from "@/services/pokemonService";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PokemonListProps {
  title: string;
  pokemonList: Pokemon[];
  droppableId: string;
  onDragEnd?: (result: DropResult) => void;
}

const PokemonList = ({ title, pokemonList, droppableId, onDragEnd }: PokemonListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredPokemon = pokemonList.filter(pokemon => 
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Pokemon..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-2 min-h-[400px]">
        <Droppable droppableId={droppableId}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {filteredPokemon.length > 0 ? (
                filteredPokemon.map((pokemon, index) => (
                  <Draggable
                    key={`${pokemon.id}-${droppableId}`}
                    draggableId={`${pokemon.id}-${droppableId}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <PokemonCard
                          pokemon={pokemon}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  {searchTerm ? "No Pokemon found" : "No Pokemon here yet"}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
};

export default PokemonList;
