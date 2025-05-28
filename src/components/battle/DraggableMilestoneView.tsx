
import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
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
  const [localRankings, setLocalRankings] = useState(formattedRankings);
  const maxItems = getMaxItemsForTier();
  const displayRankings = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  console.log(`🎯 [DRAGGABLE_MILESTONE_DEBUG] ===== COMPONENT RENDER =====`);
  console.log(`🎯 [DRAGGABLE_MILESTONE_DEBUG] onManualReorder prop:`, typeof onManualReorder, !!onManualReorder);
  console.log(`🎯 [DRAGGABLE_MILESTONE_DEBUG] onManualReorder function exists:`, typeof onManualReorder === 'function');

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

  console.log(`🏆 [MILESTONE_RENDER_ULTRA_DEBUG] About to render ${displayRankings.length} Pokemon in draggable milestone view`);
  
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

      {/* Draggable Grid Layout */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={displayRankings.map(p => p.id)} 
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-5 gap-4 mb-6">
            {displayRankings.map((pokemon, index) => (
              <DraggablePokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                isPending={pendingRefinements.has(pokemon.id)}
              />
            ))}
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
