
import React from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import { RankedPokemon } from "@/services/pokemon";

interface RankingGridProps {
  rankedPokemon: RankedPokemon[];
  onReorder: (newOrder: RankedPokemon[]) => void;
  isDraggable?: boolean;
}

export const RankingGrid: React.FC<RankingGridProps> = ({
  rankedPokemon,
  onReorder,
  isDraggable = true
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = rankedPokemon.findIndex(pokemon => String(pokemon.id) === String(active.id));
    const newIndex = rankedPokemon.findIndex(pokemon => String(pokemon.id) === String(over.id));

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(rankedPokemon, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  const activePokemon = activeId ? rankedPokemon.find(p => String(p.id) === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={rankedPokemon.map(p => String(p.id))} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {rankedPokemon.map((pokemon, index) => (
            <DraggablePokemonMilestoneCard
              key={pokemon.id}
              pokemon={pokemon}
              index={index}
              showRank={true}
              isDraggable={isDraggable}
              context="ranked"
              allRankedPokemon={rankedPokemon}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activePokemon && (
          <DraggablePokemonMilestoneCard
            pokemon={activePokemon}
            index={rankedPokemon.findIndex(p => p.id === activePokemon.id)}
            showRank={true}
            isDraggable={false}
            context="ranked"
            allRankedPokemon={rankedPokemon}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};
