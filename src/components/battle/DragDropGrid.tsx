
import React from "react";
import {
  DndContext,
  closestCenter,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useDragAndDrop } from "@/hooks/battle/useDragAndDrop";
import DraggablePokemonCard from "./DraggablePokemonCard";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  onMarkAsPending: (pokemonId: number) => void;
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending
}) => {
  console.log(`🔍 [GRID_DEBUG] DragDropGrid render with ${displayRankings.length} Pokemon`);
  console.log(`🔍 [GRID_DEBUG] onManualReorder function exists: ${!!onManualReorder}`);
  console.log(`🔍 [GRID_DEBUG] onManualReorder type: ${typeof onManualReorder}`);

  const handleManualReorderWithDebug = React.useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔍 [GRID_DEBUG] ===== GRID MANUAL REORDER WRAPPER =====`);
    console.log(`🔍 [GRID_DEBUG] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    console.log(`🔍 [GRID_DEBUG] onManualReorder available: ${!!onManualReorder}`);
    
    // Mark as pending immediately
    onMarkAsPending(draggedPokemonId);
    console.log(`🔍 [GRID_DEBUG] Marked Pokemon ${draggedPokemonId} as pending`);
    
    // CRITICAL: Call the enhanced reorder logic
    if (typeof onManualReorder === 'function') {
      console.log(`🔍 [GRID_DEBUG] ===== CALLING ENHANCED REORDER =====`);
      try {
        onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
        console.log(`🔍 [GRID_DEBUG] ✅ Enhanced reorder call completed`);
      } catch (error) {
        console.error(`🔍 [GRID_DEBUG] ❌ Error in enhanced reorder:`, error);
      }
    } else {
      console.error(`🔍 [GRID_DEBUG] ❌ onManualReorder is not a function!`, typeof onManualReorder);
    }
    
    console.log(`🔍 [GRID_DEBUG] ===== GRID WRAPPER COMPLETE =====`);
  }, [onManualReorder, onMarkAsPending]);

  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: handleManualReorderWithDebug,
    onLocalReorder
  });

  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🔍 [GRID_DEBUG] ===== DRAG STARTED =====`);
    console.log(`🔍 [GRID_DEBUG] Active ID:`, event.active.id);
    
    const draggedPokemonId = Number(event.active.id);
    const draggedPokemon = displayRankings.find(p => p.id === draggedPokemonId);
    
    // Mark as pending when drag starts
    onMarkAsPending(draggedPokemonId);
    
    console.log(`🔍 [GRID_DEBUG] Marked ${draggedPokemon?.name} as pending`);
  };

  const handleDragOver = (event: DragOverEvent) => {
    console.log(`🔍 [GRID_DEBUG] Dragging over:`, event.over?.id || 'none');
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={displayRankings.map(p => p.id)} 
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {displayRankings.map((pokemon, index) => {
            const isPending = localPendingRefinements.has(pokemon.id);
            const pendingCount = pendingBattleCounts.get(pokemon.id) || 0;
            
            return (
              <DraggablePokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                isPending={isPending}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default DragDropGrid;
