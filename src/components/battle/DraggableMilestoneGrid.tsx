
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  defaultDropAnimationSideEffects,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";
import { useDragAndDrop } from "@/hooks/battle/useDragAndDrop";

interface DraggableMilestoneGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
}

const DraggableMilestoneGrid: React.FC<DraggableMilestoneGridProps> = ({
  displayRankings,
  localPendingRefinements,
  onManualReorder
}) => {
  const [activePokemon, setActivePokemon] = React.useState<Pokemon | RankedPokemon | null>(null);

  console.log(`🎯 [DRAGGABLE_MILESTONE_GRID] Rendering with ${displayRankings.length} Pokemon`);
  console.log(`🎯 [DRAGGABLE_MILESTONE_GRID] onManualReorder provided: ${!!onManualReorder}`);

  // Define sensors directly in this component
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Only use drag and drop if onManualReorder is provided
  const { handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: onManualReorder || (() => {
      console.log(`🎯 [DRAGGABLE_MILESTONE_GRID] No manual reorder handler - drag disabled`);
    }),
    onLocalReorder: () => {} // Not needed for milestone grid
  });

  const handleDragStart = (event: any) => {
    const activePokemon = displayRankings.find(p => p.id === event.active.id);
    setActivePokemon(activePokemon || null);
  };

  const handleDragEndWithCleanup = (event: any) => {
    handleDragEnd(event);
    setActivePokemon(null);
  };

  // Custom drop animation for smoother transitions
  const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  };

  const content = (
    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
      {displayRankings.map((pokemon, index) => (
        <DraggablePokemonMilestoneCard
          key={pokemon.id}
          pokemon={pokemon}
          index={index}
          showRank={true}
          isDraggable={!!onManualReorder}
          context="ranked"
          isPending={localPendingRefinements.has(pokemon.id)}
        />
      ))}
    </div>
  );

  // Only wrap in DndContext if we have a manual reorder handler
  if (onManualReorder) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          console.log("[MILESTONE_GRID_COLLISION_ARGS]", args);
          const results = closestCenter(args);
          console.log("[MILESTONE_GRID_COLLISION_RESULTS]", results);
          return results;
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEndWithCleanup}
      >
        <SortableContext 
          items={displayRankings.map(p => p.id.toString())} 
          strategy={rectSortingStrategy}
        >
          {content}
        </SortableContext>
        
        {/* Drag Overlay for smooth cursor following */}
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activePokemon ? (
            <div className="rotate-2 scale-105">
              <DraggablePokemonMilestoneCard
                pokemon={activePokemon}
                index={displayRankings.findIndex(p => p.id === activePokemon.id)}
                showRank={true}
                isDraggable={false}
                context="ranked"
                isPending={localPendingRefinements.has(activePokemon.id)}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return content;
};

export default DraggableMilestoneGrid;
