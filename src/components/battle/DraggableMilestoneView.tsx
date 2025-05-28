
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

  // Update local rankings when formattedRankings changes
  React.useEffect(() => {
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder,
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
