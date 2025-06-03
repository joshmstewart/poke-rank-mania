
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

  // PERFORMANCE FIX: Only include ranked Pokemon IDs for collision detection
  // This dramatically reduces the collision detection overhead
  const sortableItems = displayRankings.map(p => p.id);

  return (
    <div 
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`}
    >
      <SortableContext 
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {displayRankings.map((pokemon, index) => {
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
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
};

export default DragDropGrid;
