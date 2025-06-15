
import React from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  onMarkAsPending: (pokemonId: number) => void;
  availablePokemon?: any[];
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending,
  availablePokemon = []
}) => {
  // Set up a droppable zone that accepts available Pokemon
  const { setNodeRef, isOver } = useDroppable({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  });

  // Include ranked Pokemon IDs AND available Pokemon IDs for proper collision detection
  const sortableItems = [
    ...displayRankings.map(p => p.id),
    ...availablePokemon.map(p => `available-${p.id}`),
    ...Array.from({length: 10}, (_, i) => `collision-placeholder-${i}`)
  ];

  return (
    <div 
      ref={setNodeRef}
      className={`transition-colors min-h-36 ${isOver ? 'bg-yellow-50/50' : ''}`}
    >
      <SortableContext 
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {displayRankings.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white text-gray-400 animate-fade-in select-none opacity-75">
              <span className="mb-1 text-2xl">🡆</span>
              <span>Drop Pokémon here to start ranking!</span>
            </div>
          ) : (
            displayRankings.map((pokemon, index) => {
              const isPending = localPendingRefinements.has(pokemon.id);
              const pendingCount = pendingBattleCounts.get(pokemon.id) || 0;
              
              return (
                <DraggablePokemonMilestoneCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={index}
                  isPending={isPending}
                  showRank={true}
                  isDraggable={true}
                  isAvailable={false}
                  context="ranked"
                  allRankedPokemon={displayRankings}
                />
              );
            })
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default DragDropGrid;

