
import React, { useMemo, useCallback } from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";
import { useRenderTracker } from "@/hooks/battle/useRenderTracker";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  onMarkAsPending: (pokemonId: number) => void;
  availablePokemon?: any[];
}

const DragDropGrid: React.FC<DragDropGridProps> = React.memo(({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending,
  availablePokemon = []
}) => {
  // Track renders for performance debugging
  useRenderTracker('DragDropGrid', { 
    rankingsCount: displayRankings.length,
    pendingCount: localPendingRefinements.size 
  });

  // Memoize sortable items to prevent recreation on every render
  const sortableItems = useMemo(() => {
    return displayRankings.map(p => p.id);
  }, [displayRankings]);

  // Set up droppable zone with memoized configuration
  const droppableConfig = useMemo(() => ({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  }), []);

  const { setNodeRef, isOver } = useDroppable(droppableConfig);

  // Memoize the grid style to prevent recreation
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'
  }), []);

  return (
    <div 
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`}
    >
      <SortableContext 
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4" style={gridStyle}>
          {displayRankings.map((pokemon, index) => {
            const isPending = localPendingRefinements.has(pokemon.id);
            
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
});

DragDropGrid.displayName = 'DragDropGrid';

export default DragDropGrid;
