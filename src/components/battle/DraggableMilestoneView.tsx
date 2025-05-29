
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


  // CRITICAL FIX: Enhanced manual reorder handler that ensures pending state persists
  const handleManualReorderWithPersistence = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🚨 [DND_PENDING_FIX] Manual reorder with persistence for Pokemon ${draggedPokemonId}`);
    
    // Ensure the Pokemon stays pending
    markAsPending(draggedPokemonId);
    
    // Call the original handler
    onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    
    // Dispatch additional persistence event
    const persistEvent = new CustomEvent('ensure-pending-persistence', {
      detail: { pokemonId: draggedPokemonId, timestamp: Date.now() }
    });
    document.dispatchEvent(persistEvent);
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
          onManualReorder={handleManualReorderWithPersistence}
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
