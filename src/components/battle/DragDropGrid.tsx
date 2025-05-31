
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
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending
}) => {
  console.log(`🔍 [GRID_DEBUG] DragDropGrid render with ${displayRankings.length} Pokemon`);

  // Set up a droppable zone that accepts available Pokemon
  const { setNodeRef, isOver } = useDroppable({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  });

  // CRITICAL FIX: Include both ranked Pokemon IDs AND placeholder IDs for collision detection
  // This allows collision detection to work when dragging available Pokemon over ranked ones
  const sortableItems = [
    ...displayRankings.map(p => p.id),
    // Add placeholder items for collision detection with available Pokemon
    ...Array.from({length: 10}, (_, i) => `collision-placeholder-${i}`)
  ];

  console.log(`🔍 [GRID_DEBUG] Sortable items:`, sortableItems.slice(0, 5), '...');

  return (
    <div 
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`}
    >
      <SortableContext 
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
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
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
};

export default DragDropGrid;
