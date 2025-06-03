
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
  console.log(`🎯 [GRID_RENDER_DEBUG] DragDropGrid rendering with ${displayRankings.length} items`);

  // CRITICAL: Memoize sortable items based on actual pokemon IDs
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => p.id);
    console.log(`🎯 [GRID_RENDER_DEBUG] Sortable items created:`, items.slice(0, 5), '...');
    return items;
  }, [displayRankings.map(p => p.id).join(',')]); // Only change when actual IDs change

  // CRITICAL: Static droppable configuration
  const droppableConfig = useMemo(() => ({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  }), []); // Never changes

  const { setNodeRef, isOver } = useDroppable(droppableConfig);

  // CRITICAL: Static grid style
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'
  }), []); // Never changes

  // CRITICAL: Memoize grid class names
  const gridClassName = useMemo(() => 
    `transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`, 
    [isOver]
  );

  // CRITICAL: Memoize the rendered cards to prevent unnecessary recreation
  const renderedCards = useMemo(() => {
    console.log(`🎯 [GRID_RENDER_DEBUG] Creating rendered cards for ${displayRankings.length} pokemon`);
    
    return displayRankings.map((pokemon, index) => {
      const isPending = localPendingRefinements.has(pokemon.id);
      
      console.log(`🎯 [GRID_RENDER_DEBUG] Creating card for ${pokemon.name} at index ${index}, pending: ${isPending}`);
      
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
    });
  }, [
    displayRankings.map(p => `${p.id}-${p.name}`).join(','), // Only re-create when actual pokemon change
    Array.from(localPendingRefinements).sort().join(',') // Only when pending set actually changes
  ]);

  console.log(`🎯 [GRID_RENDER_DEBUG] DragDropGrid render complete`);

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
          {renderedCards}
        </div>
      </SortableContext>
    </div>
  );
}, (prevProps, nextProps) => {
  // CRITICAL: Enhanced comparison with detailed logging
  console.log(`🎯 [GRID_MEMO_DEBUG] Comparing props for re-render decision`);
  
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Rankings length changed: ${prevProps.displayRankings.length} -> ${nextProps.displayRankings.length}`);
    return false;
  }
  
  // Check if any Pokemon in the rankings actually changed
  for (let i = 0; i < prevProps.displayRankings.length; i++) {
    const prev = prevProps.displayRankings[i];
    const next = nextProps.displayRankings[i];
    
    if (prev.id !== next.id || prev.name !== next.name) {
      console.log(`🎯 [GRID_MEMO_DEBUG] Pokemon changed at index ${i}: ${prev.name} -> ${next.name}`);
      return false;
    }
  }
  
  // Check pending refinements
  if (prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Pending refinements size changed: ${prevProps.localPendingRefinements.size} -> ${nextProps.localPendingRefinements.size}`);
    return false;
  }
  
  // Compare pending refinements content
  for (const id of prevProps.localPendingRefinements) {
    if (!nextProps.localPendingRefinements.has(id)) {
      console.log(`🎯 [GRID_MEMO_DEBUG] Pending refinement removed: ${id}`);
      return false;
    }
  }
  
  console.log(`🎯 [GRID_MEMO_DEBUG] No meaningful changes detected, preventing re-render`);
  return true;
});

DragDropGrid.displayName = 'DragDropGrid';

export default DragDropGrid;
