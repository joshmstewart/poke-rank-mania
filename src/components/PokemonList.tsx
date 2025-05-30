
import React, { useState } from "react";
import { DropResult } from "react-beautiful-dnd";
import { Pokemon } from "@/services/pokemon";
import PokemonListControls from "./pokemon/PokemonListControls";
import { PokemonListContent } from "./pokemon/PokemonListContent";
import PokemonListOverlay from "./pokemon/PokemonListOverlay";
import { usePokemonGrouping } from "@/hooks/pokemon/usePokemonGrouping";
import { useGenerationExpansion } from "@/hooks/pokemon/useGenerationExpansion";
import { getPokemonGeneration } from "@/components/pokemon/generationUtils";

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
  
  // Get unique generations from the pokemon list
  const generations = Array.from(new Set(
    pokemonList
      .map(pokemon => getPokemonGeneration(pokemon.id)?.id)
      .filter(Boolean)
  )) as number[];
  
  const { 
    isGenerationExpanded, 
    toggleGeneration, 
    expandAll, 
    collapseAll, 
    allExpanded 
  } = useGenerationExpansion(generations);
  
  const groupedAndFilteredPokemon = usePokemonGrouping(
    pokemonList, 
    searchTerm, 
    isRankingArea,
    isRankingArea ? undefined : isGenerationExpanded
  );

  // Show collapse all button only for available Pokemon (not ranking area) and when showing generation headers
  const showCollapseAll = !isRankingArea && groupedAndFilteredPokemon.showGenerationHeaders;

  return (
    <div className={`flex flex-col h-full ${isRankingArea ? 'relative' : ''}`}>
      <PokemonListControls
        title={title}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showCollapseAll={showCollapseAll}
        allExpanded={allExpanded}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        hideSearch={isRankingArea}
      />
      
      <PokemonListContent
        items={groupedAndFilteredPokemon.items}
        showGenerationHeaders={groupedAndFilteredPokemon.showGenerationHeaders}
        viewMode={viewMode}
        isRankingArea={isRankingArea}
        isGenerationExpanded={isRankingArea ? undefined : isGenerationExpanded}
        onToggleGeneration={isRankingArea ? undefined : toggleGeneration}
      />
      
      <PokemonListOverlay
        droppableId={droppableId}
        isRankingArea={isRankingArea}
      />
    </div>
  );
};

export default PokemonList;
