
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

  // Memoize sortable items with stable dependency
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => p.id);
    console.log(`🎯 [GRID_RENDER_DEBUG] Creating sortable items:`, items.slice(0, 3), '... (total:', items.length, ')');
    return items;
  }, [displayRankings.length, displayRankings.map(p => p.id).join(',')]); // Only change when IDs actually change

  // Static droppable configuration (never changes)
  const droppableConfig = useMemo(() => ({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  }), []); // Static

  const { setNodeRef, isOver } = useDroppable(droppableConfig);

  // Static grid style (never changes)
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'
  }), []); // Static

  // Memoize grid class names
  const gridClassName = useMemo(() => 
    `transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`, 
    [isOver]
  );

  // Memoize the rendered cards with very specific dependencies
  const renderedCards = useMemo(() => {
    console.log(`🎯 [GRID_RENDER_DEBUG] Creating rendered cards for ${displayRankings.length} pokemon`);
    
    return displayRankings.map((pokemon, index) => {
      const isPending = localPendingRefinements.has(pokemon.id);
      
      console.log(`🎯 [GRID_RENDER_DEBUG] Creating card for ${pokemon.name} at index ${index}, pending: ${isPending}`);
      
      return (
        <DraggablePokemonMilestoneCard
          key={pokemon.id} // Stable key
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
    displayRankings.length, // Length changes
    displayRankings.map(p => p.id).join(','), // Pokemon IDs and order
    Array.from(localPendingRefinements).sort().join(',') // Pending status changes
  ]);

  console.log(`🎯 [GRID_RENDER_DEBUG] DragDropGrid render complete with ${renderedCards.length} cards`);

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
  // Enhanced comparison with detailed logging
  console.log(`🎯 [GRID_MEMO_DEBUG] Comparing props for re-render decision`);
  
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Rankings length changed: ${prevProps.displayRankings.length} -> ${nextProps.displayRankings.length}`);
    return false; // Allow re-render
  }
  
  // Check if any Pokemon in the rankings actually changed
  for (let i = 0; i < prevProps.displayRankings.length; i++) {
    const prev = prevProps.displayRankings[i];
    const next = nextProps.displayRankings[i];
    
    if (prev.id !== next.id || prev.name !== next.name) {
      console.log(`🎯 [GRID_MEMO_DEBUG] Pokemon changed at index ${i}: ${prev.name} -> ${next.name}`);
      return false; // Allow re-render
    }
  }
  
  // Check pending refinements
  if (prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Pending refinements size changed: ${prevProps.localPendingRefinements.size} -> ${nextProps.localPendingRefinements.size}`);
    return false; // Allow re-render
  }
  
  // Compare pending refinements content
  for (const id of prevProps.localPendingRefinements) {
    if (!nextProps.localPendingRefinements.has(id)) {
      console.log(`🎯 [GRID_MEMO_DEBUG] Pending refinement removed: ${id}`);
      return false; // Allow re-render
    }
  }
  
  console.log(`🎯 [GRID_MEMO_DEBUG] No meaningful changes detected, preventing re-render`);
  return true; // Prevent re-render
});

DragDropGrid.displayName = 'DragDropGrid';

export default DragDropGrid;
