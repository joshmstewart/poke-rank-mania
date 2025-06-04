
import React, { useMemo, useCallback, useState } from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  useDndContext
} from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import OptimizedDraggableCard from "./OptimizedDraggableCard";
import DragOverlayContent from "./DragOverlayContent";
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
  // ITEM 4: Add verification log at top-level
  React.useEffect(() => {
    console.log("✅ [HOOK_DEBUG] DragDropGrid - useEffect hook executed successfully");
  }, []);

  console.log(`🎯 [OPTIMIZED_GRID] DragDropGrid rendering with ${displayRankings.length} items`);

  // CRITICAL FIX: ALWAYS call hooks unconditionally - no try-catch or conditional logic
  const dndContext = useDndContext();
  const { active } = dndContext;
  
  // CRITICAL FIX: Remove the useDroppable hook that was causing the entire grid to be a drop zone
  // Individual sortable cards will handle their own drop logic

  const activePokemon = useMemo(() => {
    if (!active) return null;
    
    const activeId = typeof active.id === 'string' ? parseInt(active.id) : active.id;
    return displayRankings.find(p => p.id === activeId) || null;
  }, [active, displayRankings]);

  const sortableItems = useMemo(() => {
    // CRITICAL FIX: Use the correct ID format that matches SortableRankedCard
    const items = displayRankings.map(p => `sortable-ranking-${p.id}`);
    console.log(`🎯 [OPTIMIZED_GRID] Creating sortable items with correct IDs:`, items);
    return items;
  }, [displayRankings]);

  // CRITICAL FIX: Remove the grid className that was highlighting the entire area
  const gridClassName = ""; // No special highlighting for the grid container

  // CRITICAL FIX: Always render the same component structure - no conditional rendering
  const renderedCards = useMemo(() => {
    console.log(`🎯 [OPTIMIZED_GRID] Creating cards for ${displayRankings.length} pokemon - FIXED CONDITIONAL RENDERING`);
    
    return displayRankings.map((pokemon, index) => {
      const isPending = localPendingRefinements.has(pokemon.id);
      
      // ALWAYS render OptimizedDraggableCard with correct context
      return (
        <OptimizedDraggableCard
          key={pokemon.id}
          pokemon={pokemon}
          index={index}
          isPending={isPending}
          context="ranked"
        />
      );
    });
  }, [displayRankings, localPendingRefinements]);

  console.log(`🎯 [OPTIMIZED_GRID] Grid render complete - no conflicting drop zones`);

  return (
    <div className={gridClassName}>
      <DndKitInternalTracker />
      
      <SortableContext 
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div 
          className="grid gap-4" 
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
        >
          {renderedCards}
        </div>
      </SortableContext>
    </div>
  );
}, (prevProps, nextProps) => {
  console.log(`🎯 [OPTIMIZED_GRID_MEMO] Comparing props for re-render decision`);
  
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    console.log(`🎯 [OPTIMIZED_GRID_MEMO] Rankings length changed - ALLOWING RE-RENDER`);
    return false;
  }
  
  for (let i = 0; i < Math.min(5, prevProps.displayRankings.length); i++) {
    const prev = prevProps.displayRankings[i];
    const next = nextProps.displayRankings[i];
    
    if (prev.id !== next.id) {
      console.log(`🎯 [OPTIMIZED_GRID_MEMO] Pokemon order changed - ALLOWING RE-RENDER`);
      return false;
    }
  }
  
  if (prevProps.localPendingRefinements.size !== nextProps.localPendingRefinements.size) {
    console.log(`🎯 [OPTIMIZED_GRID_MEMO] Pending refinements changed - ALLOWING RE-RENDER`);
    return false;
  }
  
  console.log(`🎯 [OPTIMIZED_GRID_MEMO] No changes detected - PREVENTING RE-RENDER`);
  return true;
});

DragDropGrid.displayName = 'DragDropGrid';

export default DragDropGrid;
