
import React from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import PokemonCard from "@/components/PokemonCard";
import GenerationHeader from "./GenerationHeader";
import { useAutoScroll } from "@/hooks/pokemon/useAutoScroll";

interface PokemonListContentProps {
  droppableId: string;
  items: Array<{ type: 'header' | 'pokemon'; data: any; generationId?: number }>;
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isRankingArea: boolean;
  isGenerationExpanded?: (genId: number) => boolean;
  onToggleGeneration?: (genId: number) => void;
}

const PokemonListContent: React.FC<PokemonListContentProps> = ({
  droppableId,
  items,
  showGenerationHeaders,
  viewMode,
  isRankingArea,
  isGenerationExpanded,
  onToggleGeneration
}) => {
  const pokemonCount = items.filter(item => item.type === 'pokemon').length;
  const { containerRef } = useAutoScroll(pokemonCount, isRankingArea);

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-auto bg-gray-50 rounded-lg p-2 min-h-[400px] ${isRankingArea ? 'z-20 relative' : 'z-10 relative'}`}
    >
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
            {items.length > 0 ? (
              items.map((item, index) => {
                if (item.type === 'header') {
                  // Render generation header
                  const isExpanded = isGenerationExpanded ? isGenerationExpanded(item.generationId!) : true;
                  return (
                    <GenerationHeader
                      key={`header-${item.generationId}`}
                      generationId={item.generationId!}
                      name={item.data.name}
                      region={item.data.region}
                      games={item.data.games}
                      viewMode={viewMode}
                      isExpanded={isExpanded}
                      onToggle={() => onToggleGeneration && onToggleGeneration(item.generationId!)}
                    />
                  );
                } else {
                  // Render Pokemon card
                  const pokemon = item.data;
                  let draggableIndex = index;
                  
                  // If showing generation headers, we need to adjust the draggable index
                  // to account for the non-draggable headers
                  if (showGenerationHeaders) {
                    draggableIndex = items
                      .slice(0, index)
                      .filter(i => i.type === 'pokemon')
                      .length;
                  }
                  
                  return (
                    <Draggable
                      key={`${pokemon.id}-${droppableId}`}
                      draggableId={`${pokemon.id}-${droppableId}`}
                      index={draggableIndex}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="relative z-10"
                          data-pokemon-id={pokemon.id}
                        >
                          <PokemonCard
                            pokemon={pokemon}
                            isDragging={snapshot.isDragging}
                            viewMode={viewMode}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                }
              })
            ) : (
              <div className={`flex items-center justify-center ${viewMode === "grid" ? "col-span-full" : ""} h-32 text-muted-foreground`}>
                No Pokemon found
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default PokemonListContent;
