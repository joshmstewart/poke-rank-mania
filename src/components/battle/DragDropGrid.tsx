
import React, { useMemo, useCallback, useState } from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  useDroppable,
  DragOverlay,
  useDndContext
} from '@dnd-kit/core';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import OptimizedDraggableCard from "./OptimizedDraggableCard";
import DragOverlayContent from "./DragOverlayContent";
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
  console.log(`🎯 [OPTIMIZED_GRID] DragDropGrid rendering with ${displayRankings.length} items`);

  const { active } = useDndContext();
  
  // Find the active pokemon for DragOverlay
  const activePokemon = useMemo(() => {
    if (!active) return null;
    
    const activeId = typeof active.id === 'string' ? parseInt(active.id) : active.id;
    return displayRankings.find(p => p.id === activeId) || null;
  }, [active, displayRankings]);

  // Stable items array for SortableContext
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => p.id);
    console.log(`🎯 [OPTIMIZED_GRID] Creating sortable items - count: ${items.length}`);
    return items;
  }, [displayRankings]);

  const { setNodeRef, isOver } = useDroppable({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  });

  const gridClassName = `transition-colors ${isOver ? 'bg-yellow-50/50' : ''}`;

  // Use optimized cards for better performance
  const renderedCards = useMemo(() => {
    console.log(`🎯 [OPTIMIZED_GRID] Creating optimized cards for ${displayRankings.length} pokemon`);
    
    return displayRankings.map((pokemon, index) => {
      const isPending = localPendingRefinements.has(pokemon.id);
      
      // Use debugger for first 3 items, optimized cards for the rest
      if (index < 3) {
        console.log(`🎯 [OPTIMIZED_GRID] Using SortableContextDebugger for ${pokemon.name} at index ${index}`);
        return (
          <SortableContextDebugger
            key={pokemon.id}
            pokemonId={pokemon.id}
            pokemonName={pokemon.name}
            index={index}
          />
        );
      }
      
      console.log(`🎯 [OPTIMIZED_GRID] Using OptimizedDraggableCard for ${pokemon.name} at index ${index}`);
      
      return (
        <OptimizedDraggableCard
          key={pokemon.id}
          pokemon={pokemon}
          index={index}
          isPending={isPending}
          showRank={true}
          isDraggable={true}
          context="ranked"
        />
      );
    });
  }, [displayRankings, localPendingRefinements]);

  console.log(`🎯 [OPTIMIZED_GRID] Grid render complete with DragOverlay support`);

  return (
    <div 
      ref={setNodeRef}
      className={gridClassName}
    >
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

      <DragOverlay>
        {activePokemon ? (
          <DragOverlayContent 
            pokemon={activePokemon} 
            context="ranked"
          />
        ) : null}
      </DragOverlay>
    </div>
  );
}, (prevProps, nextProps) => {
  console.log(`🎯 [OPTIMIZED_GRID_MEMO] Comparing props for re-render decision`);
  
  if (prevProps.displayRankings.length !== nextProps.displayRankings.length) {
    console.log(`🎯 [OPTIMIZED_GRID_MEMO] Rankings length changed - ALLOWING RE-RENDER`);
    return false;
  }
  
  // Quick comparison of first few items to detect order changes
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
