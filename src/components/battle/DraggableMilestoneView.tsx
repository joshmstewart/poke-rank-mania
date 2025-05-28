
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
  console.log(`🎯 [DRAGGABLE_MILESTONE_DEBUG] ===== COMPONENT RENDER =====`);
  console.log(`🎯 [DRAGGABLE_MILESTONE_DEBUG] onManualReorder prop:`, typeof onManualReorder, !!onManualReorder);
  console.log(`🎯 [DRAGGABLE_MILESTONE_DEBUG] onManualReorder function exists:`, typeof onManualReorder === 'function');

  const [localRankings, setLocalRankings] = useState(formattedRankings);
  const maxItems = getMaxItemsForTier();
  const displayRankings = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  console.log(`🎯 [DRAGGABLE_MILESTONE_DEBUG] Display rankings count: ${displayRankings.length}`);
  console.log(`🎯 [DRAGGABLE_MILESTONE_DEBUG] Display rankings IDs: ${displayRankings.map(p => p.id).join(', ')}`);

  // Update local rankings when formattedRankings changes
  React.useEffect(() => {
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  // CRITICAL FIX: Create a wrapper function to ensure the manual reorder is called correctly
  const handleManualReorderWrapper = React.useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🎯 [DRAGGABLE_MILESTONE_WRAPPER] ===== MANUAL REORDER WRAPPER CALLED =====`);
    console.log(`🎯 [DRAGGABLE_MILESTONE_WRAPPER] Parameters: draggedPokemonId=${draggedPokemonId}, sourceIndex=${sourceIndex}, destinationIndex=${destinationIndex}`);
    console.log(`🎯 [DRAGGABLE_MILESTONE_WRAPPER] onManualReorder function exists:`, typeof onManualReorder === 'function');
    
    if (typeof onManualReorder === 'function') {
      console.log(`🎯 [DRAGGABLE_MILESTONE_WRAPPER] ✅ Calling onManualReorder`);
      try {
        onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
        console.log(`🎯 [DRAGGABLE_MILESTONE_WRAPPER] ✅ onManualReorder called successfully`);
      } catch (error) {
        console.error(`🎯 [DRAGGABLE_MILESTONE_WRAPPER] ❌ Error calling onManualReorder:`, error);
      }
    } else {
      console.error(`🎯 [DRAGGABLE_MILESTONE_WRAPPER] ❌ onManualReorder is not a function:`, typeof onManualReorder);
    }
    console.log(`🎯 [DRAGGABLE_MILESTONE_WRAPPER] ===== END MANUAL REORDER WRAPPER =====`);
  }, [onManualReorder]);

  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: handleManualReorderWrapper,
    onLocalReorder: setLocalRankings
  });

  // ENHANCED drag start and drag over logging
  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🎯 [DRAG_START_DEBUG] ===== DRAG STARTED =====`);
    console.log(`🎯 [DRAG_START_DEBUG] Active ID: ${event.active.id}`);
    console.log(`🎯 [DRAG_START_DEBUG] Active element:`, event.active);
    console.log(`🎯 [DRAG_START_DEBUG] Event:`, event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    console.log(`🎯 [DRAG_OVER_DEBUG] Dragging over: ${event.over?.id || 'none'}`);
    console.log(`🎯 [DRAG_OVER_DEBUG] Event:`, event);
  };

  // Log detailed DndContext setup
  console.log(`🏆 [DND_CONTEXT_ULTRA_DEBUG] ===== DndContext Setup =====`);
  console.log(`🏆 [DND_CONTEXT_ULTRA_DEBUG] Sensors initialized:`, !!sensors);
  console.log(`🏆 [DND_CONTEXT_ULTRA_DEBUG] Sensors count:`, sensors?.length || 0);
  console.log(`🏆 [DND_CONTEXT_ULTRA_DEBUG] handleDragEnd function:`, typeof handleDragEnd);
  console.log(`🏆 [DND_CONTEXT_ULTRA_DEBUG] collisionDetection:`, typeof closestCenter);
  console.log(`🏆 [DND_CONTEXT_ULTRA_DEBUG] displayRankings for SortableContext:`, displayRankings.map(p => ({ id: p.id, name: p.name })));
  console.log(`🏆 [DND_CONTEXT_ULTRA_DEBUG] SortableContext items:`, displayRankings.map(p => p.id));
  console.log(`🏆 [DND_CONTEXT_ULTRA_DEBUG] Strategy:`, typeof rectSortingStrategy);
  
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

      {/* Enhanced Draggable Grid Layout with more debugging */}
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
          <div className="grid grid-cols-5 gap-4 mb-6">
            {displayRankings.map((pokemon, index) => {
              console.log(`🏆 [MILESTONE_RENDER_CARD_DEBUG] Rendering card ${index}: ${pokemon.name} (ID: ${pokemon.id})`);
              console.log(`🏆 [MILESTONE_RENDER_CARD_DEBUG] Pokemon ID type:`, typeof pokemon.id);
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
