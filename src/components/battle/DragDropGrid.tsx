
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

  // CRITICAL: Create stable items array for SortableContext
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => p.id);
    console.log(`🎯 [GRID_RENDER_DEBUG] Creating sortable items - count: ${items.length}`);
    return items;
  }, [displayRankings.length, displayRankings.map(p => p.id).join(',')]); // More specific dependencies

  // Static droppable configuration
  const droppableConfig = useMemo(() => ({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  }), []); // Static - never changes

  const { setNodeRef, isOver } = useDroppable(droppableConfig);

  // Static grid style
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'
  }), []); // Static - never changes

  // Memoize grid class names
  const gridClassName = useMemo(() => 
    `transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`, 
    [isOver]
  );

  // CRITICAL: Create a stable array of pending IDs for memo dependencies
  const pendingIdsArray = useMemo(() => 
    Array.from(localPendingRefinements).sort(), 
    [localPendingRefinements.size, Array.from(localPendingRefinements).join(',')]
  );

  // CRITICAL: Render cards with very specific, stable props
  const renderedCards = useMemo(() => {
    console.log(`🎯 [GRID_RENDER_DEBUG] Creating rendered cards for ${displayRankings.length} pokemon`);
    
    return displayRankings.map((pokemon, index) => {
      const isPending = localPendingRefinements.has(pokemon.id);
      
      console.log(`🎯 [GRID_RENDER_DEBUG] Creating card for ${pokemon.name} at index ${index}, pending: ${isPending}`);
      
      return (
        <DraggablePokemonMilestoneCard
          key={pokemon.id} // Stable key based on Pokemon ID
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
    // CRITICAL: Only depend on specific values that actually affect rendering
    displayRankings.length,
    displayRankings.map(p => `${p.id}-${p.name}`).join('|'), // Pokemon identity
    pendingIdsArray.join(',') // Pending status
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
  
  // Check rankings length
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Rankings length changed: ${prevProps.displayRankings.length} -> ${nextProps.displayRankings.length} - ALLOWING RE-RENDER`);
    return false;
  }
  
  // Check if any Pokemon actually changed (ID or name only)
  for (let i = 0; i < prevProps.displayRankings.length; i++) {
    const prev = prevProps.displayRankings[i];
    const next = nextProps.displayRankings[i];
    
    if (prev.id !== next.id) {
      console.log(`🎯 [GRID_MEMO_DEBUG] Pokemon ID changed at index ${i}: ${prev.id} -> ${next.id} - ALLOWING RE-RENDER`);
      return false;
    }
    
    if (prev.name !== next.name) {
      console.log(`🎯 [GRID_MEMO_DEBUG] Pokemon name changed at index ${i}: ${prev.name} -> ${next.name} - ALLOWING RE-RENDER`);
      return false;
    }
  }
  
  // Check pending refinements
  if (prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Pending refinements size changed: ${prevProps.localPendingRefinements.size} -> ${nextProps.localPendingRefinements.size} - ALLOWING RE-RENDER`);
    return false;
  }
  
  // Compare pending refinements content efficiently
  const prevPendingArray = Array.from(prevProps.localPendingRefinements).sort();
  const nextPendingArray = Array.from(nextProps.localPendingRefinements).sort();
  const pendingChanged = prevPendingArray.join(',') !== nextPendingArray.join(',');
  
  if (pendingChanged) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Pending refinements content changed - ALLOWING RE-RENDER`);
    return false;
  }
  
  console.log(`🎯 [GRID_MEMO_DEBUG] No meaningful changes detected - PREVENTING RE-RENDER`);
  return true; // Prevent re-render
});

DragDropGrid.displayName = 'DragDropGrid';

export default DragDropGrid;
