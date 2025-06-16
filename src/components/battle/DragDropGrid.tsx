
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
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts?: Map<number, number>;
  onMarkAsPending?: (pokemonId: number) => void;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  availablePokemon?: any[];
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts = new Map(),
  onMarkAsPending,
  onManualReorder,
  onLocalReorder,
  availablePokemon = []
}) => {
  const [activePokemon, setActivePokemon] = React.useState<Pokemon | RankedPokemon | null>(null);

  // Set up drop zone for rankings grid
  const { setNodeRef: setDropZoneRef, isOver } = useDroppable({
    id: 'rankings-grid-drop-zone',
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  });

  console.log(`[DRAG_DROP_ZONE] Rankings grid drop zone initialized:`, {
    id: 'rankings-grid-drop-zone',
    setNodeRef: !!setDropZoneRef,
    isOver,
    accepts: ['available-pokemon', 'ranked-pokemon'],
    data: {
      type: 'rankings-grid',
      accepts: ['available-pokemon', 'ranked-pokemon']
    }
  });

  console.log(`[DRAG_DROP_ZONE_DETAILED] Drop zone state change:`, {
    isOver,
    displayRankingsCount: displayRankings.length,
    timestamp: new Date().toISOString()
  });

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
    console.log(`[DND_DEBUG] Milestone grid drag start:`, event.active.id);
    const { active } = event;
    const pokemon = displayRankings.find(p => p.id.toString() === active.id);
    setActivePokemon(pokemon || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`[DND_DEBUG] Milestone grid drag end:`, event.active.id, '→', event.over?.id);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayRankings.findIndex(p => p.id.toString() === active.id);
      const newIndex = displayRankings.findIndex(p => p.id.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log(`[DND_DEBUG] Reordering from ${oldIndex} to ${newIndex}`);
        
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

  console.log(`[DRAG_GRID] Rendering grid with ${displayRankings.length} Pokemon, sortableItems:`, displayRankings.map(p => p.id.toString()));
  console.log(`[DRAG_GRID] Drop zone isOver:`, isOver);

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

  const gridContent = (
    <div 
      className={`grid gap-4 mb-6 transition-colors duration-200 ${
        isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-2' : ''
      }`}
      style={{ 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        // Hardware acceleration for the grid container
        transform: 'translateZ(0)',
        willChange: 'auto',
        minHeight: displayRankings.length === 0 ? '200px' : 'auto'
      }}
    >
      {displayRankings.length === 0 && (
        <div className="col-span-full flex items-center justify-center h-48 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <p className="text-lg mb-2">No Pokémon ranked yet</p>
            <p className="text-sm">Drag Pokémon here to start ranking</p>
          </div>
        </div>
      )}
      
      {displayRankings.map((pokemon, index) => {
        console.log(`[DRAG_GRID] Rendering card ${pokemon.name} at index ${index}`);
        const isDragging = activePokemon?.id === pokemon.id;
        console.log(`[DRAG_GRID] ${pokemon.name} isDragging: ${isDragging}, opacity: ${isDragging ? 0.5 : 1}`);
        
        return (
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
        );
      })}
    </div>
  );

  // Only wrap in DndContext if we have a manual reorder handler
  if (onManualReorder) {
    return (
      <div ref={setDropZoneRef} className="w-full">
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
            {gridContent}
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
      </div>
    );
  }

  return <div ref={setDropZoneRef} className="w-full">{gridContent}</div>;
};

export default DragDropGrid;
