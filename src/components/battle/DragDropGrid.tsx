
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { 
  DndContext, 
  closestCenter, 
  useSensors, 
  useSensor, 
  PointerSensor, 
  TouchSensor, 
  KeyboardSensor,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";
import SortablePokemonCard from "./SortablePokemonCard";

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

  console.log(`[DRAG_DROP_GRID] Rendering with ${displayRankings.length} ranked Pokemon using sortable approach`);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    console.log(`[SORTABLE_GRID] Drag start:`, event.active.id);
    const pokemon = displayRankings.find(p => p.id.toString() === event.active.id);
    setActivePokemon(pokemon || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`[SORTABLE_GRID] Drag end:`, event.active.id, '→', event.over?.id);
    const { active, over } = event;
    setActivePokemon(null);

    if (over && active.id !== over.id) {
      const oldIndex = displayRankings.findIndex(p => p.id.toString() === active.id);
      const newIndex = displayRankings.findIndex(p => p.id.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log(`[SORTABLE_GRID] Reordering from ${oldIndex} to ${newIndex}`);
        
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
  };

  if (displayRankings.length === 0) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <p className="text-lg mb-2">No Pokémon ranked yet</p>
          <p className="text-sm">Drag Pokémon from the Available section to start ranking</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full min-h-[400px]">
        <SortableContext 
          items={displayRankings.map(p => p.id.toString())} 
          strategy={verticalListSortingStrategy}
        >
          {/* Responsive grid layout matching Available Pokemon section */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 mb-6">
            {displayRankings.map((pokemon, index) => (
              <SortablePokemonCard
                key={pokemon.id}
                id={pokemon.id.toString()}
                pokemon={pokemon}
                index={index}
                isPending={localPendingRefinements.has(pokemon.id)}
                allRankedPokemon={displayRankings}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay for smooth dragging experience */}
        <DragOverlay>
          {activePokemon ? (
            <div className="rotate-2 scale-105 opacity-90">
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
      </div>
    </DndContext>
  );
};

export default DragDropGrid;
