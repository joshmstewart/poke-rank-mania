
import React, { useMemo } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import InfiniteScrollHandler from "./InfiniteScrollHandler";
import { usePendingRefinementsManager } from "@/hooks/battle/usePendingRefinementsManager";
import DragDropGridMemoized from "./DragDropGridMemoized";
import MilestoneHeader from "./MilestoneHeader";
import MilestoneDebugLogger from "./MilestoneDebugLogger";
import MilestoneStateManager from "./MilestoneStateManager";
import MilestoneDragProvider from "./MilestoneDragProvider";

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
  pendingRefinements = new Set<number>()
}) => {
  console.log(`🏆 [MILESTONE_VIEW] Rendering milestone view with ${formattedRankings.length} rankings`);

  const {
    localPendingRefinements,
    pendingBattleCounts,
    markAsPending,
    updateFromProps
  } = usePendingRefinementsManager(pendingRefinements);
  
  const maxItems = getMaxItemsForTier();

  // Memoized header content
  const headerContent = useMemo(() => (
    <MilestoneHeader
      battlesCompleted={battlesCompleted}
      displayCount={Math.min(milestoneDisplayCount, maxItems)}
      activeTier={activeTier}
      maxItems={maxItems}
      onContinueBattles={onContinueBattles}
    />
  ), [battlesCompleted, milestoneDisplayCount, activeTier, maxItems, onContinueBattles]);

  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  return (
    <div className="bg-white p-6 w-full max-w-7xl mx-auto">
      {headerContent}

      <MilestoneStateManager
        formattedRankings={formattedRankings}
        onManualReorder={onManualReorder}
      >
        {({
          localRankings,
          displayRankings,
          isManualOperationInProgress,
          manualOperationTimestamp,
          handleEnhancedManualReorder,
          stableOnLocalReorder
        }) => (
          <>
            <MilestoneDebugLogger
              formattedRankings={formattedRankings}
              localRankings={localRankings}
              displayRankings={displayRankings}
              isManualOperationInProgress={isManualOperationInProgress}
              manualOperationTimestamp={manualOperationTimestamp}
            />

            <MilestoneDragProvider
              displayRankings={displayRankings.slice(0, Math.min(milestoneDisplayCount, maxItems))}
              handleEnhancedManualReorder={handleEnhancedManualReorder}
              stableOnLocalReorder={stableOnLocalReorder}
            >
              <DragDropGridMemoized
                displayRankings={displayRankings.slice(0, Math.min(milestoneDisplayCount, maxItems))}
                localPendingRefinements={localPendingRefinements}
                pendingBattleCounts={pendingBattleCounts}
              />
            </MilestoneDragProvider>
          </>
        )}
      </MilestoneStateManager>

      <InfiniteScrollHandler 
        hasMoreToLoad={hasMoreToLoad}
        currentCount={Math.min(milestoneDisplayCount, maxItems)}
        maxItems={maxItems}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only allow re-renders for major changes like battle count or tier changes
  const shouldPreventRerender = (
    prevProps.battlesCompleted === nextProps.battlesCompleted &&
    prevProps.activeTier === nextProps.activeTier &&
    prevProps.milestoneDisplayCount === nextProps.milestoneDisplayCount
  );
  
  console.log('🎨 [MILESTONE_MEMO] Enhanced memo comparison result:', shouldPreventRerender ? 'PREVENTING' : 'ALLOWING', 'rerender');
  
  return shouldPreventRerender;
});

DraggableMilestoneView.displayName = 'DraggableMilestoneView';

export default DraggableMilestoneView;
