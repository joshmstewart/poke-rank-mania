
import React, { useMemo, useCallback } from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";
import SortableContextDebugger from "./SortableContextDebugger";
import DndKitInternalTracker from "./DndKitInternalTracker";

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

  // CRITICAL: Add @dnd-kit internal state tracking
  console.log(`🔍 [DND_CONTEXT_DEBUG] DragDropGrid: About to render with DndKitInternalTracker`);

  // CRITICAL: Create stable items array for SortableContext
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => p.id);
    console.log(`🎯 [GRID_RENDER_DEBUG] Creating sortable items - count: ${items.length}`);
    console.log(`🔍 [DND_CONTEXT_DEBUG] SortableContext items array: [${items.slice(0, 3).join(', ')}...]`);
    return items;
  }, [displayRankings.length, displayRankings.map(p => p.id).join(',')]);

  // Static droppable configuration
  const droppableConfig = useMemo(() => ({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  }), []);

  const { setNodeRef, isOver } = useDroppable(droppableConfig);

  console.log(`🔍 [DND_CONTEXT_DEBUG] DragDropGrid: useDroppable isOver state: ${isOver}`);

  // Static grid style
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'
  }), []);

  // Memoize grid class names
  const gridClassName = useMemo(() => 
    `transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`, 
    [isOver]
  );

  // CRITICAL: Use simplified debugger components for first 5 items to isolate the issue
  const renderedCards = useMemo(() => {
    console.log(`🎯 [GRID_RENDER_DEBUG] Creating rendered cards for ${displayRankings.length} pokemon`);
    
    return displayRankings.map((pokemon, index) => {
      // CRITICAL: Use simplified debugger for first 5 items, then regular cards
      if (index < 5) {
        console.log(`🎯 [GRID_RENDER_DEBUG] Using SortableContextDebugger for ${pokemon.name} at index ${index}`);
        return (
          <SortableContextDebugger
            key={pokemon.id}
            pokemonId={pokemon.id}
            pokemonName={pokemon.name}
            index={index}
          />
        );
      }
      
      const isPending = localPendingRefinements.has(pokemon.id);
      
      console.log(`🎯 [GRID_RENDER_DEBUG] Creating regular card for ${pokemon.name} at index ${index}, pending: ${isPending}`);
      
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
    displayRankings.length,
    displayRankings.map(p => `${p.id}-${p.name}`).join('|'),
    Array.from(localPendingRefinements).sort().join(',')
  ]);

  console.log(`🎯 [GRID_RENDER_DEBUG] DragDropGrid render complete with ${renderedCards.length} cards`);
  console.log(`🔍 [DND_CONTEXT_DEBUG] DragDropGrid: About to render SortableContext with items: [${sortableItems.slice(0, 3).join(', ')}...]`);

  return (
    <div 
      ref={setNodeRef}
      className={gridClassName}
    >
      {/* CRITICAL: Add @dnd-kit internal state tracker */}
      <DndKitInternalTracker />
      
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
  console.log(`🎯 [GRID_MEMO_DEBUG] Comparing props for re-render decision`);
  
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Rankings length changed: ${prevProps.displayRankings.length} -> ${nextProps.displayRankings.length} - ALLOWING RE-RENDER`);
    return false;
  }
  
  for (let i = 0; i < prevProps.displayRankings.length; i++) {
    const prev = prevProps.displayRankings[i];
    const next = nextProps.displayRankings[i];
    
    if (prev.id !== next.id || prev.name !== next.name) {
      console.log(`🎯 [GRID_MEMO_DEBUG] Pokemon changed at index ${i}: ${prev.id}/${prev.name} -> ${next.id}/${next.name} - ALLOWING RE-RENDER`);
      return false;
    }
  }
  
  if (prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Pending refinements size changed - ALLOWING RE-RENDER`);
    return false;
  }
  
  const prevPendingArray = Array.from(prevProps.localPendingRefinements).sort();
  const nextPendingArray = Array.from(nextProps.localPendingRefinements).sort();
  if (prevPendingArray.join(',') !== nextPendingArray.join(',')) {
    console.log(`🎯 [GRID_MEMO_DEBUG] Pending refinements content changed - ALLOWING RE-RENDER`);
    return false;
  }
  
  console.log(`🎯 [GRID_MEMO_DEBUG] No meaningful changes detected - PREVENTING RE-RENDER`);
  return true;
});

DragDropGrid.displayName = 'DragDropGrid';

export default DragDropGrid;
