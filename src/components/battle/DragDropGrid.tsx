
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
  availablePokemon?: any[]; // Add this to get available Pokemon for collision detection
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
  console.log(`🔍 [GRID_DEBUG] DragDropGrid render with ${displayRankings.length} Pokemon`);

  // Set up a droppable zone that accepts available Pokemon
  const { setNodeRef, isOver } = useDroppable({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  });

  // CRITICAL FIX: Include ranked Pokemon IDs AND available Pokemon IDs for proper collision detection
  const sortableItems = [
    ...displayRankings.map(p => p.id), // Ranked Pokemon IDs (numbers)
    ...availablePokemon.map(p => `available-${p.id}`), // Available Pokemon IDs (available-X format)
    // Add placeholder items for additional collision detection
    ...Array.from({length: 10}, (_, i) => `collision-placeholder-${i}`)
  ];

  console.log(`🔍 [GRID_DEBUG] Sortable items:`, sortableItems.slice(0, 5), '...');
  console.log(`🔍 [GRID_DEBUG] Available Pokemon count for collision: ${availablePokemon.length}`);

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
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
};

export default DragDropGrid;
