
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
  console.log(`🚨 [DND_SETUP_DEBUG] ===== DraggableMilestoneView RENDER =====`);
  console.log(`🚨 [DND_SETUP_DEBUG] Initial pending refinements:`, Array.from(pendingRefinements));
  console.log(`🚨 [DND_ENHANCED_FIX] onManualReorder function:`, !!onManualReorder);

  const [localRankings, setLocalRankings] = useState(formattedRankings);
  
  const {
    localPendingRefinements,
    pendingBattleCounts,
    markAsPending,
    updateFromProps
  } = usePendingRefinementsManager(pendingRefinements);
  
  console.log(`🚨 [DND_PENDING_FIX] Local pending refinements in milestone view:`, Array.from(localPendingRefinements));
  
  const maxItems = getMaxItemsForTier();
  const displayRankings = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  // Update local state when props change
  useEffect(() => {
    console.log(`🚨 [DND_SETUP_DEBUG] Updating local rankings from props`);
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  // ENHANCED FIX: Direct manual reorder handler that properly calls the enhanced logic
  const handleManualReorderDirect = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🚨 [DND_ENHANCED_FIX] ===== DIRECT MANUAL REORDER CALLED =====`);
    console.log(`🚨 [DND_ENHANCED_FIX] Pokemon ID: ${draggedPokemonId}`);
    console.log(`🚨 [DND_ENHANCED_FIX] Source: ${sourceIndex} → Destination: ${destinationIndex}`);
    
    // Ensure the Pokemon stays pending
    markAsPending(draggedPokemonId);
    
    // CRITICAL FIX: Call the enhanced reorder logic directly
    if (onManualReorder) {
      console.log(`🚨 [DND_ENHANCED_FIX] Calling onManualReorder with enhanced logic...`);
      onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    } else {
      console.error(`🚨 [DND_ENHANCED_FIX] ❌ onManualReorder is not available!`);
    }
    
    console.log(`🚨 [DND_ENHANCED_FIX] ===== DIRECT MANUAL REORDER COMPLETE =====`);
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
          onManualReorder={handleManualReorderDirect}
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
