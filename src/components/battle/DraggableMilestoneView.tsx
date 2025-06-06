
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

  // Update local state when props change, but only if we don't have local changes
  useEffect(() => {
    console.log(`🏆 [MILESTONE_DRAG_SYNC] Props changed - formattedRankings: ${formattedRankings.length}, localRankings: ${localRankings.length}`);
    
    // Only update if the rankings are significantly different (suggesting external update)
    // This prevents overwriting local drag changes
    const hasSignificantDifference = Math.abs(formattedRankings.length - localRankings.length) > 0 ||
      formattedRankings.slice(0, 5).some((p, i) => p.id !== localRankings[i]?.id);
    
    if (hasSignificantDifference) {
      console.log(`🏆 [MILESTONE_DRAG_SYNC] Significant difference detected, updating local rankings`);
      setLocalRankings(formattedRankings);
    } else {
      console.log(`🏆 [MILESTONE_DRAG_SYNC] No significant difference, keeping local rankings to preserve drag state`);
    }
  }, [formattedRankings]);

  // FIXED: Use enhanced manual reorder with proper callback that doesn't cause resets
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings as RankedPokemon[],
    (updatedRankings: RankedPokemon[]) => {
      console.log(`🏆 [MILESTONE_DRAG_FIXED] Enhanced reorder callback with ${updatedRankings.length} Pokemon`);
      setLocalRankings(updatedRankings);
      // NOTE: Removed call to onManualReorder here to prevent reset conflicts
    },
    true // preventAutoResorting = true to maintain manual order
  );

  // FIXED: Simplified drag and drop that only uses enhanced reorder
  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
      console.log(`🏆 [MILESTONE_DRAG_FIXED] Drag completed: ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
      console.log(`🏆 [MILESTONE_DRAG_FIXED] Using ONLY enhanced manual reorder (no original handler)`);
      
      // CRITICAL FIX: Only call the enhanced manual reorder
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
      
      console.log(`🏆 [MILESTONE_DRAG_FIXED] Enhanced reorder completed successfully`);
    },
    onLocalReorder: (newRankings) => {
      console.log(`🏆 [MILESTONE_DRAG_FIXED] Local reorder for immediate UI feedback with ${newRankings.length} Pokemon`);
      setLocalRankings(newRankings);
    }
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
          onManualReorder={handleEnhancedManualReorder}
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
