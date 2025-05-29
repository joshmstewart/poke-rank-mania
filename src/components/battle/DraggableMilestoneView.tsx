
import React, { useState } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { usePendingRefinementsManager } from "@/hooks/battle/usePendingRefinementsManager";
import DragDropGrid from "./DragDropGrid";
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
  console.log(`🚨 [DND_SETUP_DEBUG] Initial pending refinements:`, Array.from(pendingRefinements));

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
  React.useEffect(() => {
    console.log(`🚨 [DND_SETUP_DEBUG] Updating local rankings from props`);
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  React.useEffect(() => {
    console.log(`🚨 [DND_SETUP_DEBUG] Updating local pending refinements from props`);
    updateFromProps(pendingRefinements);
  }, [pendingRefinements, updateFromProps]);

  return (
    <div className="bg-white p-6 w-full max-w-7xl mx-auto">
      <MilestoneHeader
        battlesCompleted={battlesCompleted}
        displayCount={displayRankings.length}
        activeTier={activeTier}
        maxItems={maxItems}
        pendingRefinementsCount={localPendingRefinements.size}
        onContinueBattles={onContinueBattles}
      />

      <div className="mb-6">
        <DragDropGrid
          displayRankings={displayRankings}
          localPendingRefinements={localPendingRefinements}
          pendingBattleCounts={pendingBattleCounts}
          onManualReorder={onManualReorder}
          onLocalReorder={setLocalRankings}
          onMarkAsPending={markAsPending}
        />
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
