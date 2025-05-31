import React, { useState, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { Button } from "@/components/ui/button";
import InfiniteScrollHandler from "./InfiniteScrollHandler";
import AutoBattleLogsModal from "./AutoBattleLogsModal";
import { usePendingRefinementsManager } from "@/hooks/battle/usePendingRefinementsManager";
import { useDragAndDrop } from "@/hooks/battle/useDragAndDrop";
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import DraggableMilestoneGrid from "./DraggableMilestoneGrid";

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
  
  const {
    localPendingRefinements,
    pendingBattleCounts,
    markAsPending,
    updateFromProps
  } = usePendingRefinementsManager(pendingRefinements);
  
  const maxItems = getMaxItemsForTier();
  const displayRankings = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  // Update local state when props change
  useEffect(() => {
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  // Use enhanced manual reorder hook to track implied battles
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    formattedRankings as RankedPokemon[],
    (updatedRankings: RankedPokemon[]) => {
      setLocalRankings(updatedRankings);
      // Also call the original handler if provided
      // Note: onManualReorder might not expect this, but we'll keep the flow
    },
    true // preventAutoResorting = true to maintain manual order
  );

  // Enhanced drag and drop that uses both handlers
  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
      console.log(`🔥 [MILESTONE_DRAG_DEBUG] Drag completed: ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
      
      // Call the enhanced manual reorder for implied battle tracking
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
      
      // Also call the original handler
      if (onManualReorder) {
        onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
      }
    },
    onLocalReorder: setLocalRankings
  });

  return (
    <div className="bg-white p-6 w-full max-w-7xl mx-auto">
      {/* Header - exactly matching the image */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <h1 className="text-xl font-bold text-gray-800">
            Milestone: {battlesCompleted} Battles
          </h1>
          <span className="text-gray-500 text-sm">
            (Showing {displayRankings.length} of {activeTier === "All" ? maxItems : Math.min(Number(activeTier), maxItems)})
          </span>
          <AutoBattleLogsModal />
        </div>
        
        <Button 
          onClick={onContinueBattles}
          className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium"
        >
          Continue Battles
        </Button>
      </div>

      {/* Draggable Grid Layout - exactly 5 columns like the reference with softer colors */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <DraggableMilestoneGrid
          displayRankings={displayRankings}
          localPendingRefinements={localPendingRefinements}
        />
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
