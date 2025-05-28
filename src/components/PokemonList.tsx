
import React, { useState } from "react";
import { DropResult } from "react-beautiful-dnd";
import { Pokemon } from "@/services/pokemon";
import PokemonListControls from "./pokemon/PokemonListControls";
import PokemonListContent from "./pokemon/PokemonListContent";
import PokemonListOverlay from "./pokemon/PokemonListOverlay";
import { usePokemonGrouping } from "@/hooks/pokemon/usePokemonGrouping";

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
  
  const groupedAndFilteredPokemon = usePokemonGrouping(pokemonList, searchTerm, isRankingArea);

  return (
    <div className={`flex flex-col h-full ${isRankingArea ? 'relative' : ''}`}>
      <PokemonListControls
        title={title}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <PokemonListContent
        droppableId={droppableId}
        items={groupedAndFilteredPokemon.items}
        showGenerationHeaders={groupedAndFilteredPokemon.showGenerationHeaders}
        viewMode={viewMode}
        isRankingArea={isRankingArea}
      />
      
      <PokemonListOverlay
        droppableId={droppableId}
        isRankingArea={isRankingArea}
      />
    </div>
  );
};

export default PokemonList;
