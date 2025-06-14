
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";

interface DraggableMilestoneGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
}

const DraggableMilestoneGrid: React.FC<DraggableMilestoneGridProps> = ({
  displayRankings,
  localPendingRefinements,
  onManualReorder,
  onLocalReorder
}) => {
  const [activePokemon, setActivePokemon] = React.useState<Pokemon | RankedPokemon | null>(null);

  console.log(`🎯 [DRAGGABLE_MILESTONE_GRID] Rendering with ${displayRankings.length} Pokemon`);
  console.log(`🎯 [DRAGGABLE_MILESTONE_GRID] onManualReorder provided: ${!!onManualReorder}`);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 0,
        tolerance: 2,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const pokemon = displayRankings.find(p => p.id.toString() === active.id);
    setActivePokemon(pokemon || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayRankings.findIndex(p => p.id.toString() === active.id);
      const newIndex = displayRankings.findIndex(p => p.id.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Perform local reorder for optimistic UI update
        if (onLocalReorder) {
          const newOrder = arrayMove(displayRankings, oldIndex, newIndex);
          onLocalReorder(newOrder);
        }

        // Trigger manual reorder for backend logic
        if (onManualReorder) {
          const draggedPokemonId = displayRankings[oldIndex].id;
          onManualReorder(draggedPokemonId, oldIndex, newIndex);
        }
      }
    }
    setActivePokemon(null);
  };

  // Hardware accelerated drop animation for smoother transitions
  const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
    // Add hardware acceleration to drop animation
    keyframes({ transform }: any) {
      return [
        { opacity: 1, transform: transform.initial },
        { opacity: 0.8, transform: `${transform.initial} scale(1.05)` },
        { opacity: 1, transform: transform.final },
      ];
    },
    duration: 200,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  };

  const content = (
    <div 
      className="grid gap-4 mb-6" 
      style={{ 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        // Hardware acceleration for the grid container
        transform: 'translateZ(0)',
        willChange: 'auto'
      }}
    >
      {displayRankings.map((pokemon, index) => (
        <DraggablePokemonMilestoneCard
          key={pokemon.id}
          pokemon={pokemon}
          index={index}
          showRank={true}
          isDraggable={!!onManualReorder}
          context="ranked"
          isPending={localPendingRefinements.has(pokemon.id)}
          allRankedPokemon={displayRankings}
        />
      ))}
    </div>
  );

  // Only wrap in DndContext if we have a manual reorder handler
  if (onManualReorder) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={displayRankings.map(p => p.id.toString())} 
          strategy={rectSortingStrategy}
        >
          {content}
        </SortableContext>
        
        {/* Hardware accelerated Drag Overlay for smooth cursor following */}
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activePokemon ? (
            <div 
              className="rotate-2 scale-105"
              style={{
                transform: 'translateZ(0)',
                willChange: 'transform',
                backfaceVisibility: 'hidden'
              }}
            >
              <DraggablePokemonMilestoneCard
                pokemon={activePokemon}
                index={displayRankings.findIndex(p => p.id === activePokemon.id)}
                showRank={true}
                isDraggable={false}
                context="ranked"
                isPending={localPendingRefinements.has(activePokemon.id)}
                allRankedPokemon={displayRankings}
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
