
import React, { useState, useEffect, useMemo } from "react";
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
import DragDropGridMemoized from "./DragDropGridMemoized";
import { useStableDragHandlers } from "@/hooks/battle/useStableDragHandlers";

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

const DraggableMilestoneView: React.FC<DraggableMilestoneViewProps> = React.memo(({
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
  console.log(`🏆 [MILESTONE_STABLE] Rendering milestone view with ${formattedRankings.length} rankings`);

  const [localRankings, setLocalRankings] = useState(formattedRankings);
  
  const {
    localPendingRefinements,
    pendingBattleCounts,
    markAsPending,
    updateFromProps
  } = usePendingRefinementsManager(pendingRefinements);
  
  const maxItems = getMaxItemsForTier();
  
  // Memoize display rankings to prevent recreation
  const displayRankings = useMemo(() => 
    localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems)),
    [localRankings, milestoneDisplayCount, maxItems]
  );
  
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    onManualReorder,
    (newRankings: any[]) => setLocalRankings(newRankings)
  );

  // Update local state when props change, but only if we don't have local changes
  useEffect(() => {
    console.log(`🏆 [MILESTONE_STABLE] Props changed - checking for updates`);
    
    const hasSignificantDifference = Math.abs(formattedRankings.length - localRankings.length) > 0 ||
      formattedRankings.slice(0, 5).some((p, i) => p.id !== localRankings[i]?.id);
    
    if (hasSignificantDifference) {
      console.log(`🏆 [MILESTONE_STABLE] Updating local rankings`);
      setLocalRankings(formattedRankings);
    }
  }, [formattedRankings]);

  // FIXED: Use only the enhanced manual reorder
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings as RankedPokemon[],
    stableOnLocalReorder,
    true // preventAutoResorting = true to maintain manual order
  );

  // FIXED: Simplified drag and drop that only uses enhanced reorder
  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
      console.log(`🏆 [MILESTONE_STABLE] Drag completed: ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    },
    onLocalReorder: stableOnLocalReorder
  });

  // Memoized header content
  const headerContent = useMemo(() => (
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
  ), [battlesCompleted, displayRankings.length, activeTier, maxItems, onContinueBattles]);

  return (
    <div className="bg-white p-6 w-full max-w-7xl mx-auto">
      {headerContent}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <DragDropGridMemoized
          displayRankings={displayRankings}
          localPendingRefinements={localPendingRefinements}
          pendingBattleCounts={pendingBattleCounts}
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
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.formattedRankings.length === nextProps.formattedRankings.length &&
    prevProps.battlesCompleted === nextProps.battlesCompleted &&
    prevProps.milestoneDisplayCount === nextProps.milestoneDisplayCount &&
    prevProps.activeTier === nextProps.activeTier
  );
});

DraggableMilestoneView.displayName = 'DraggableMilestoneView';

export default DraggableMilestoneView;
