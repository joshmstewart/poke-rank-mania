
import React, { useMemo, useCallback } from "react";
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

const DragDropGrid: React.FC<DragDropGridProps> = React.memo(({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending,
  availablePokemon = []
}) => {
  console.log(`🎯 [GRID_RENDER_TRACKER] DragDropGrid rendering with ${displayRankings.length} items`);

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

  // Memoize grid class names
  const gridClassName = useMemo(() => 
    `transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`, 
    [isOver]
  );

  return (
    <div 
      ref={setNodeRef}
      className={gridClassName}
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
}, (prevProps, nextProps) => {
  // Enhanced comparison to prevent unnecessary re-renders
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    console.log(`🎯 [GRID_MEMO_TRACKER] Rankings length changed: ${prevProps.displayRankings.length} -> ${nextProps.displayRankings.length}`);
    return false;
  }
  
  // Check if any Pokemon in the rankings actually changed
  for (let i = 0; i < prevProps.displayRankings.length; i++) {
    const prev = prevProps.displayRankings[i];
    const next = nextProps.displayRankings[i];
    
    if (prev.id !== next.id || prev.name !== next.name) {
      console.log(`🎯 [GRID_MEMO_TRACKER] Pokemon changed at index ${i}: ${prev.name} -> ${next.name}`);
      return false;
    }
  }
  
  // Check pending refinements
  if (prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size) {
    console.log(`🎯 [GRID_MEMO_TRACKER] Pending refinements size changed: ${prevProps.localPendingRefinements.size} -> ${nextProps.localPendingRefinements.size}`);
    return false;
  }
  
  // Compare pending refinements content
  for (const id of prevProps.localPendingRefinements) {
    if (!nextProps.localPendingRefinements.has(id)) {
      console.log(`🎯 [GRID_MEMO_TRACKER] Pending refinement removed: ${id}`);
      return false;
    }
  }
  
  console.log(`🎯 [GRID_MEMO_TRACKER] No meaningful changes detected, preventing re-render`);
  return true;
});

DragDropGrid.displayName = 'DragDropGrid';

export default DragDropGrid;
