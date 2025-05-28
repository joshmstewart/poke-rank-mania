
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
  console.log(`🚨 [DND_SETUP_DEBUG] ===== DraggableMilestoneView RENDER =====`);
  console.log(`🚨 [DND_SETUP_DEBUG] @dnd-kit/core version check:`, typeof DndContext);
  console.log(`🚨 [DND_SETUP_DEBUG] @dnd-kit/sortable version check:`, typeof SortableContext);
  console.log(`🚨 [DND_SETUP_DEBUG] Pokemon count:`, formattedRankings.length);
  console.log(`🚨 [DND_SETUP_DEBUG] onManualReorder exists:`, typeof onManualReorder === 'function');

  const [localRankings, setLocalRankings] = useState(formattedRankings);
  const maxItems = getMaxItemsForTier();
  const displayRankings = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  console.log(`🚨 [DND_SETUP_DEBUG] Display rankings IDs:`, displayRankings.map(p => p.id));

  // Update local rankings when formattedRankings changes
  React.useEffect(() => {
    console.log(`🚨 [DND_SETUP_DEBUG] Updating local rankings from props`);
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  const handleManualReorderWrapper = React.useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🚨 [DND_SETUP_DEBUG] Manual reorder wrapper called:`, draggedPokemonId, sourceIndex, destinationIndex);
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
    console.log(`🚨 [DND_CONTEXT_DEBUG] ===== DRAG STARTED SUCCESSFULLY =====`);
    console.log(`🚨 [DND_CONTEXT_DEBUG] ✅ @dnd-kit DndContext is working!`);
    console.log(`🚨 [DND_CONTEXT_DEBUG] Active ID:`, event.active.id);
    console.log(`🚨 [DND_CONTEXT_DEBUG] Active data:`, event.active.data);
    console.log(`🚨 [DND_CONTEXT_DEBUG] Event object:`, event);
    console.log(`🚨 [DND_CONTEXT_DEBUG] This proves drag detection is working!`);
  };

  const handleDragOver = (event: DragOverEvent) => {
    console.log(`🚨 [DND_CONTEXT_DEBUG] ===== DRAGGING OVER =====`);
    console.log(`🚨 [DND_CONTEXT_DEBUG] Over ID:`, event.over?.id || 'none');
    console.log(`🚨 [DND_CONTEXT_DEBUG] Active ID:`, event.active.id);
  };

  // Critical debugging for @dnd-kit setup
  console.log(`🚨 [DND_SETUP_DEBUG] DndContext available:`, typeof DndContext === 'function');
  console.log(`🚨 [DND_SETUP_DEBUG] SortableContext available:`, typeof SortableContext === 'function');
  console.log(`🚨 [DND_SETUP_DEBUG] closestCenter available:`, typeof closestCenter === 'function');
  console.log(`🚨 [DND_SETUP_DEBUG] rectSortingStrategy available:`, typeof rectSortingStrategy === 'function');
  console.log(`🚨 [DND_SETUP_DEBUG] sensors:`, sensors?.length);
  console.log(`🚨 [DND_SETUP_DEBUG] handleDragEnd:`, typeof handleDragEnd);
  console.log(`🚨 [DND_SETUP_DEBUG] SortableContext items:`, displayRankings.map(p => p.id));

  // Add debugging for the grid container
  const handleGridPointerDown = (e: React.PointerEvent) => {
    console.log(`🚨 [GRID_DEBUG] Grid container pointer down:`, {
      target: e.target?.constructor?.name,
      currentTarget: e.currentTarget?.constructor?.name,
      clientX: e.clientX,
      clientY: e.clientY
    });
  };

  const handleGridMouseDown = (e: React.MouseEvent) => {
    console.log(`🚨 [GRID_DEBUG] Grid container mouse down:`, {
      target: e.target?.constructor?.name,
      currentTarget: e.currentTarget?.constructor?.name,
      button: e.button
    });
  };

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

      <div className="mb-6">
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
            <div 
              className="grid grid-cols-5 gap-4"
              onPointerDown={handleGridPointerDown}
              onMouseDown={handleGridMouseDown}
            >
              {displayRankings.map((pokemon, index) => {
                console.log(`🚨 [DND_SETUP_DEBUG] Rendering card ${index}: ${pokemon.name} (ID: ${pokemon.id})`);
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
