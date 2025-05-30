
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
  console.log(`🎯 [GRID_FLOW] DragDropGrid render with ${displayRankings.length} Pokemon`);
  console.log(`🎯 [GRID_FLOW] onManualReorder function exists: ${!!onManualReorder}`);

  const handleManualReorderWrapper = React.useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🎯 [GRID_FLOW] ===== MANUAL REORDER WRAPPER CALLED =====`);
    console.log(`🎯 [GRID_FLOW] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    
    // Mark as pending immediately
    onMarkAsPending(draggedPokemonId);
    
    // CRITICAL: Call the enhanced reorder logic
    if (typeof onManualReorder === 'function') {
      console.log(`🎯 [GRID_FLOW] Calling onManualReorder function...`);
      onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
      console.log(`🎯 [GRID_FLOW] onManualReorder function call completed`);
    } else {
      console.error(`🎯 [GRID_FLOW] ❌ onManualReorder is not a function!`, typeof onManualReorder);
    }
    
    console.log(`🎯 [GRID_FLOW] ===== MANUAL REORDER WRAPPER COMPLETE =====`);
  }, [onManualReorder, onMarkAsPending]);

  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: handleManualReorderWrapper,
    onLocalReorder
  });

  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🎯 [GRID_FLOW] ===== DRAG STARTED =====`);
    console.log(`🎯 [GRID_FLOW] Active ID:`, event.active.id);
    
    const draggedPokemonId = Number(event.active.id);
    const draggedPokemon = displayRankings.find(p => p.id === draggedPokemonId);
    
    // Mark as pending when drag starts
    onMarkAsPending(draggedPokemonId);
    
    console.log(`🎯 [GRID_FLOW] Marked ${draggedPokemon?.name} as pending`);
  };

  const handleDragOver = (event: DragOverEvent) => {
    console.log(`🎯 [GRID_FLOW] Dragging over:`, event.over?.id || 'none');
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
        <div className="grid grid-cols-5 gap-4">
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
