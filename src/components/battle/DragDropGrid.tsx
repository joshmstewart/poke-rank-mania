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
  console.log(`🚨 [DND_SETUP_DEBUG] DragDropGrid render with ${displayRankings.length} Pokemon`);

  const handleManualReorderWrapper = React.useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🚨 [DND_SETUP_DEBUG] Manual reorder wrapper called:`, draggedPokemonId, sourceIndex, destinationIndex);
    
    // CRITICAL FIX: Immediately show as pending and keep it persistent
    onMarkAsPending(draggedPokemonId);
    
    if (typeof onManualReorder === 'function') {
      onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    }
  }, [onManualReorder, onMarkAsPending]);

  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: handleManualReorderWrapper,
    onLocalReorder
  });

  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🚨 [DND_CONTEXT_DEBUG] ===== DRAG STARTED SUCCESSFULLY =====`);
    console.log(`🚨 [DND_CONTEXT_DEBUG] ✅ @dnd-kit DndContext is working!`);
    console.log(`🚨 [DND_CONTEXT_DEBUG] Active ID:`, event.active.id);
    
    // CRITICAL FIX: Show pending immediately when drag starts and persist it
    const draggedPokemonId = Number(event.active.id);
    onMarkAsPending(draggedPokemonId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    console.log(`🚨 [DND_CONTEXT_DEBUG] ===== DRAGGING OVER =====`);
    console.log(`🚨 [DND_CONTEXT_DEBUG] Over ID:`, event.over?.id || 'none');
    console.log(`🚨 [DND_CONTEXT_DEBUG] Active ID:`, event.active.id);
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
            console.log(`🚨 [DND_SETUP_DEBUG] Rendering card ${index}: ${pokemon.name} (ID: ${pokemon.id}) - Pending: ${isPending}, Count: ${pendingCount}`);
            
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
