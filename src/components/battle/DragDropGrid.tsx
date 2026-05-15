import React, { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import SortablePokemonCard from "./SortablePokemonCard";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts?: Map<number, number>;
  onMarkAsPending?: (pokemonId: number) => void;
  onManualReorder?: (
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  availablePokemon?: any[];
  insertionPreviewIndex?: number | null;
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts = new Map(),
  onMarkAsPending,
  onManualReorder,
  onLocalReorder,
  availablePokemon = [],
  insertionPreviewIndex = null,
}) => {
  // Make the entire rankings panel a droppable container
  const { setNodeRef, isOver } = useDroppable({
    id: "rankings-drop-zone",
    data: { type: "rankings-container" },
  });

  // Stabilize the items array reference so SortableContext doesn't see a
  // new array identity on every parent render (which would invalidate
  // dnd-kit memoization downstream).
  const sortableItems = useMemo(
    () => displayRankings.map((p) => `ranked-${(p as any).id}`),
    [displayRankings]
  );

  return (
    <div className="w-full">
      {/* IMPORTANT: the droppable ref must be on a real element that covers the grid */}
      <div
        ref={setNodeRef}
        className={`w-full min-h-[400px] ${isOver ? "ring-2 ring-blue-500" : ""}`}
        style={{ overflow: "visible", contain: "none", pointerEvents: "auto" }}
      >
        {/* Sorted / reorderable ranked cards */}
        <SortableContext
          items={sortableItems}
          strategy={rectSortingStrategy}
        >
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              overflow: "visible",
              contain: "none",
            }}
          >
            {displayRankings.map((pokemon, index) => (
              <React.Fragment key={(pokemon as any).id}>
                {insertionPreviewIndex === index && (
                  <div aria-hidden className="min-h-[140px] opacity-0" />
                )}
                <SortablePokemonCard
                  id={`ranked-${(pokemon as any).id}`}
                  pokemon={pokemon}
                  index={index}
                  isPending={localPendingRefinements.has((pokemon as any).id)}
                />
              </React.Fragment>
            ))}
            {insertionPreviewIndex === displayRankings.length && (
              <div aria-hidden className="min-h-[140px] opacity-0" />
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default DragDropGrid;