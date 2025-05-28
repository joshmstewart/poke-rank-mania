
import React, { useState } from "react";
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
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { useDragAndDrop } from "@/hooks/battle/useDragAndDrop";
import DraggablePokemonCard from "./DraggablePokemonCard";
import MilestoneHeader from "./MilestoneHeader";
import InfiniteScrollHandler from "./InfiniteScrollHandler";

interface DraggableMilestoneViewProps {
  formattedRankings: (Pokemon | RankedPokemon)[];
  battlesCompleted: number;
  activeTier: TopNOption;
  milestoneDisplayCount: number;
  onContinueBattles: () => void;
  onLoadMore: () => void;
  getMaxItemsForTier: () => number;
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  pendingRefinements?: Set<number>;
}

const DraggableMilestoneView: React.FC<DraggableMilestoneViewProps> = ({
  formattedRankings,
  battlesCompleted,
  activeTier,
  milestoneDisplayCount,
  onContinueBattles,
  onLoadMore,
  getMaxItemsForTier,
  onManualReorder,
  pendingRefinements = new Set()
}) => {
  console.log(`🚨 [DND_CRITICAL_DEBUG] ===== DraggableMilestoneView RENDER =====`);
  console.log(`🚨 [DND_CRITICAL_DEBUG] @dnd-kit/core imported:`, typeof DndContext);
  console.log(`🚨 [DND_CRITICAL_DEBUG] @dnd-kit/sortable imported:`, typeof SortableContext);
  console.log(`🚨 [DND_CRITICAL_DEBUG] Pokemon count:`, formattedRankings.length);

  const [localRankings, setLocalRankings] = useState(formattedRankings);
  const maxItems = getMaxItemsForTier();
  const displayRankings = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  console.log(`🚨 [DND_CRITICAL_DEBUG] Display rankings IDs:`, displayRankings.map(p => p.id));
  console.log(`🚨 [DND_CRITICAL_DEBUG] onManualReorder function:`, typeof onManualReorder);

  // Update local rankings when formattedRankings changes
  React.useEffect(() => {
    console.log(`🚨 [DND_CRITICAL_DEBUG] Updating local rankings from props`);
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  const handleManualReorderWrapper = React.useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🚨 [DND_CRITICAL_DEBUG] Manual reorder wrapper called:`, draggedPokemonId, sourceIndex, destinationIndex);
    if (typeof onManualReorder === 'function') {
      onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    }
  }, [onManualReorder]);

  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: handleManualReorderWrapper,
    onLocalReorder: setLocalRankings
  });

  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🚨 [DND_CRITICAL_DEBUG] ===== DRAG STARTED =====`);
    console.log(`🚨 [DND_CRITICAL_DEBUG] Active ID:`, event.active.id);
    console.log(`🚨 [DND_CRITICAL_DEBUG] Active data:`, event.active.data);
  };

  const handleDragOver = (event: DragOverEvent) => {
    console.log(`🚨 [DND_CRITICAL_DEBUG] Dragging over:`, event.over?.id || 'none');
  };

  // Critical check: ensure we have required dependencies
  console.log(`🚨 [DND_CRITICAL_DEBUG] DndContext type:`, typeof DndContext);
  console.log(`🚨 [DND_CRITICAL_DEBUG] SortableContext type:`, typeof SortableContext);
  console.log(`🚨 [DND_CRITICAL_DEBUG] rectSortingStrategy type:`, typeof rectSortingStrategy);
  console.log(`🚨 [DND_CRITICAL_DEBUG] closestCenter type:`, typeof closestCenter);
  console.log(`🚨 [DND_CRITICAL_DEBUG] sensors:`, sensors?.length);
  console.log(`🚨 [DND_CRITICAL_DEBUG] handleDragEnd:`, typeof handleDragEnd);

  return (
    <div className="bg-white p-6 w-full max-w-7xl mx-auto">
      <MilestoneHeader
        battlesCompleted={battlesCompleted}
        displayCount={displayRankings.length}
        activeTier={activeTier}
        maxItems={maxItems}
        pendingRefinementsCount={pendingRefinements.size}
        onContinueBattles={onContinueBattles}
      />

      <div 
        className="mb-6" 
        onPointerDown={(e) => {
          console.log(`🚨 [DND_CRITICAL_DEBUG] Container pointer down:`, e.target);
        }}
      >
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
                console.log(`🚨 [DND_CRITICAL_DEBUG] Rendering card ${index}: ${pokemon.name} (ID: ${pokemon.id})`);
                return (
                  <DraggablePokemonCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    index={index}
                    isPending={pendingRefinements.has(pokemon.id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <InfiniteScrollHandler 
        hasMoreToLoad={hasMoreToLoad}
        currentCount={displayRankings.length}
        maxItems={maxItems}
        onLoadMore={onLoadMore}
      />
    </div>
  );
};

export default DraggableMilestoneView;
