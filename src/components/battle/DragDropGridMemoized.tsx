
import React, { useMemo, useRef } from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import VirtualizedGrid from "./VirtualizedGrid";

interface DragDropGridMemoizedProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>; // Fix: Explicitly type as Set<number>
  pendingBattleCounts: Map<number, number>;
}

const DragDropGridMemoized: React.FC<DragDropGridMemoizedProps> = React.memo(({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts
}) => {
  console.log(`🎯 [VIRTUALIZED_GRID_WRAPPER] Rendering with ${displayRankings.length} items`);
  console.log(`🔍 [ORDER_TRACE] Before render: Current order:`, displayRankings.slice(0, 10).map(p => `${p.name}(${p.id})`));

  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize sortable items to prevent recreation on every render
  const sortableItems = useMemo(() => {
    return displayRankings.map(p => p.id);
  }, [displayRankings]);

  // Set up droppable zone with memoized configuration
  const droppableConfig = useMemo(() => ({
    id: 'rankings-grid-drop-zone-memoized',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  }), []);

  const { setNodeRef, isOver } = useDroppable(droppableConfig);

  // Grid configuration
  const gridConfig = useMemo(() => {
    const itemWidth = 160; // 140px + padding
    const itemHeight = 180; // card height + padding
    const containerWidth = 1200; // approximate container width
    const columnCount = Math.floor(containerWidth / itemWidth);
    const containerHeight = Math.min(600, Math.ceil(displayRankings.length / columnCount) * itemHeight);
    
    return {
      itemWidth,
      itemHeight,
      containerWidth,
      containerHeight,
      columnCount
    };
  }, [displayRankings.length]);

  // Memoize the grid style to prevent recreation
  const gridStyle = useMemo(() => ({
    width: '100%',
    height: gridConfig.containerHeight
  }), [gridConfig.containerHeight]);

  // Memoize grid class names
  const gridClassName = useMemo(() => 
    `transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`, 
    [isOver]
  );

  if (displayRankings.length === 0) {
    return (
      <div 
        ref={setNodeRef}
        className={gridClassName}
      >
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No Pokémon ranked yet</p>
            <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      className={gridClassName}
    >
      <SortableContext 
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div style={gridStyle}>
          <VirtualizedGrid
            items={displayRankings}
            columnCount={gridConfig.columnCount}
            itemWidth={gridConfig.itemWidth}
            itemHeight={gridConfig.itemHeight}
            containerHeight={gridConfig.containerHeight}
            containerWidth={gridConfig.containerWidth}
            context="ranked"
            localPendingRefinements={localPendingRefinements}
          />
        </div>
      </SortableContext>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    console.log(`🔄 [GRID_MEMO] Length changed: ${prevProps.displayRankings.length} -> ${nextProps.displayRankings.length}`);
    return false;
  }
  
  // Check if any Pokemon in the rankings actually changed
  for (let i = 0; i < Math.min(10, prevProps.displayRankings.length); i++) {
    const prev = prevProps.displayRankings[i];
    const next = nextProps.displayRankings[i];
    
    if (prev.id !== next.id || prev.name !== next.name) {
      console.log(`🔄 [GRID_MEMO] Order changed at position ${i}: ${prev.name} -> ${next.name}`);
      return false;
    }
  }
  
  // Check pending refinements
  if (prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size) {
    console.log(`🔄 [GRID_MEMO] Pending refinements changed: ${prevProps.localPendingRefinements.size} -> ${nextProps.localPendingRefinements.size}`);
    return false;
  }
  
  // If all checks pass, props are effectively the same
  console.log(`✅ [GRID_MEMO] Props unchanged, preventing re-render`);
  return true;
});

DragDropGridMemoized.displayName = 'DragDropGridMemoized';

export default DragDropGridMemoized;
