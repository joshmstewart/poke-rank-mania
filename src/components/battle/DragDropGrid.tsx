
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
  isAvailableSection?: boolean;
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending,
  availablePokemon = [],
  isAvailableSection = false
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: isAvailableSection ? 'available-grid-drop-zone' : 'rankings-grid-drop-zone',
    data: {
      type: isAvailableSection ? 'available-grid' : 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  });

  const sortableItems = [
    ...displayRankings.map(p => p.id),
    ...availablePokemon.map(p => `available-${p.id}`),
    ...Array.from({length: 10}, (_, i) => `collision-placeholder-${i}`)
  ];

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
            
            return (
              <DraggablePokemonMilestoneCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                isPending={isPending}
                showRank={!isAvailableSection}
                isDraggable={true}
                isAvailable={isAvailableSection}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
};

export default DragDropGrid;
