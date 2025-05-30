
import React, { useState, useEffect } from "react";
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
  console.log(`🔍 [MILESTONE_VIEW_DEBUG] ===== DraggableMilestoneView RENDER =====`);
  console.log(`🔍 [MILESTONE_VIEW_DEBUG] onManualReorder received:`, !!onManualReorder);
  console.log(`🔍 [MILESTONE_VIEW_DEBUG] onManualReorder type:`, typeof onManualReorder);
  console.log(`🔍 [MILESTONE_VIEW_DEBUG] formattedRankings length:`, formattedRankings.length);

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
    console.log(`🔍 [MILESTONE_VIEW_DEBUG] Updating local rankings from props`);
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  // CRITICAL DEBUG: Enhanced manual reorder handler with comprehensive logging
  const handleManualReorderWithLogging = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔍 [MILESTONE_VIEW_DEBUG] ===== MANUAL REORDER HANDLER CALLED =====`);
    console.log(`🔍 [MILESTONE_VIEW_DEBUG] Pokemon ID: ${draggedPokemonId}`);
    console.log(`🔍 [MILESTONE_VIEW_DEBUG] Source: ${sourceIndex} → Destination: ${destinationIndex}`);
    console.log(`🔍 [MILESTONE_VIEW_DEBUG] onManualReorder function available:`, !!onManualReorder);
    console.log(`🔍 [MILESTONE_VIEW_DEBUG] onManualReorder function type:`, typeof onManualReorder);
    
    // Mark as pending immediately
    markAsPending(draggedPokemonId);
    console.log(`🔍 [MILESTONE_VIEW_DEBUG] Marked Pokemon ${draggedPokemonId} as pending`);
    
    // CRITICAL: Test if the function exists and call it
    if (typeof onManualReorder === 'function') {
      console.log(`🔍 [MILESTONE_VIEW_DEBUG] ===== CALLING ENHANCED MANUAL REORDER =====`);
      console.log(`🔍 [MILESTONE_VIEW_DEBUG] About to call onManualReorder(${draggedPokemonId}, ${sourceIndex}, ${destinationIndex})`);
      try {
        const result = onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
        console.log(`🔍 [MILESTONE_VIEW_DEBUG] ✅ Enhanced manual reorder call completed successfully`);
        console.log(`🔍 [MILESTONE_VIEW_DEBUG] ✅ Function call result:`, result);
      } catch (error) {
        console.error(`🔍 [MILESTONE_VIEW_DEBUG] ❌ Error calling enhanced manual reorder:`, error);
        console.error(`🔍 [MILESTONE_VIEW_DEBUG] ❌ Error stack:`, error.stack);
      }
    } else {
      console.error(`🔍 [MILESTONE_VIEW_DEBUG] ❌ onManualReorder is not a function! Type:`, typeof onManualReorder);
      console.error(`🔍 [MILESTONE_VIEW_DEBUG] ❌ onManualReorder value:`, onManualReorder);
    }
    
    console.log(`🔍 [MILESTONE_VIEW_DEBUG] ===== MANUAL REORDER HANDLER COMPLETE =====`);
  };

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
          onManualReorder={handleManualReorderWithLogging}
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
