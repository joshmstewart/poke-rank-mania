
import React from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts: Map<number, number>;
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  onMarkAsPending: (pokemonId: number) => void;
  availablePokemon?: any[];
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts,
  onManualReorder,
  onLocalReorder,
  onMarkAsPending,
  availablePokemon = []
}) => {
  // We do our own DndContext/SortableContext (was missing before!)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 2 },
    })
  );

  const [activeId, setActiveId] = React.useState<number | null>(null);

  // Only ranked Pokémon IDs as sortable items
  const sortableItems = displayRankings.map(p => p.id);

  // Save dragged Pokémon (for overlay)
  const activePokemon = activeId !== null
    ? displayRankings.find((p) => p.id === activeId)
    : null;

  // Handle drag events in this grid!
  const handleDragStart = (event: DragStartEvent) => {
    const dragIdStr = event.active.id.toString();
    const dragId = Number(dragIdStr);
    setActiveId(dragId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeIdx = displayRankings.findIndex(p => p.id === Number(active.id));
    const overIdx = displayRankings.findIndex(p => p.id === Number(over.id));
    if (activeIdx === -1 || overIdx === -1) return;

    // Move in local list for immediate feedback
    const newOrder = arrayMove(displayRankings, activeIdx, overIdx);
    onLocalReorder(newOrder);

    // Update score/order in store immediately
    onManualReorder(Number(active.id), activeIdx, overIdx);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortableItems}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {displayRankings.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white text-gray-400 animate-fade-in select-none opacity-75">
              <span className="mb-1 text-2xl">🡆</span>
              <span>Drop Pokémon here to start ranking!</span>
            </div>
          ) : (
            displayRankings.map((pokemon, index) => {
              const isPending = localPendingRefinements.has(pokemon.id);
              const pendingCount = pendingBattleCounts.get(pokemon.id) || 0;
              return (
                <DraggablePokemonMilestoneCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={index}
                  isPending={isPending}
                  showRank={true}
                  isDraggable={true}
                  isAvailable={false}
                  context="ranked"
                  allRankedPokemon={displayRankings}
                />
              );
            })
          )}
        </div>
      </SortableContext>
      <DragOverlay>
        {activePokemon ? (
          <DraggablePokemonMilestoneCard
            pokemon={activePokemon}
            index={displayRankings.findIndex(p => p.id === activePokemon.id)}
            isPending={localPendingRefinements.has(activePokemon.id)}
            showRank={true}
            isDraggable={false}
            isAvailable={false}
            context="ranked"
            allRankedPokemon={displayRankings}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DragDropGrid;
