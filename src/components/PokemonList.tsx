
import React, { useState } from "react";
import { Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import PokemonCard from "./PokemonCard";
import { Pokemon } from "@/services/pokemonService";
import { Button } from "@/components/ui/button";
import { Search, List, Grid } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PokemonListProps {
  title: string;
  pokemonList: Pokemon[];
  droppableId: string;
  onDragEnd?: (result: DropResult) => void;
  isRankingArea?: boolean;
}

const PokemonList = ({ 
  title, 
  pokemonList, 
  droppableId, 
  onDragEnd,
  isRankingArea = false
}: PokemonListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  const filteredPokemon = pokemonList.filter(pokemon => 
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full ${isRankingArea ? 'relative' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`p-1 h-8 ${viewMode === "list" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`p-1 h-8 ${viewMode === "grid" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
      
      <div className={`flex-1 overflow-auto bg-gray-50 rounded-lg p-2 min-h-[400px] ${isRankingArea ? 'z-10' : ''}`}>
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`
                ${viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-2" : "space-y-2"} 
                h-full ${snapshot.isDraggingOver && isRankingArea ? 'bg-green-50 border-2 border-dashed border-green-500 rounded' : ''}
              `}
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
                          viewMode={viewMode}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className={`flex items-center justify-center ${viewMode === "grid" ? "col-span-full" : ""} h-32 text-muted-foreground`}>
                  {searchTerm ? "No Pokemon found" : "No Pokemon here yet"}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
      
      {/* Full-screen droppable overlay that appears when dragging and this is the ranking area */}
      {isRankingArea && (
        <Droppable droppableId={`${droppableId}-overlay`}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`absolute inset-0 z-0 ${snapshot.isDraggingOver ? 'bg-green-100/50' : ''}`}
              style={{ 
                display: snapshot.isDraggingOver ? 'block' : 'none',
                pointerEvents: snapshot.isDraggingOver ? 'auto' : 'none'
              }}
            >
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
};

export default PokemonList;
