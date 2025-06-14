import React, { useState, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { Button } from "@/components/ui/button";
import InfiniteScrollHandler from "./InfiniteScrollHandler";
import AutoBattleLogsModal from "./AutoBattleLogsModal";
import { usePendingRefinementsManager } from "@/hooks/battle/usePendingRefinementsManager";
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import DraggableMilestoneGrid from "./DraggableMilestoneGrid";
import { formatPokemonName } from "@/utils/pokemon";

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
  // Format names in the rankings data before using them
  const [localRankings, setLocalRankings] = useState(() => {
    return formattedRankings.map(pokemon => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name)
    }));
  });
  
  const {
    localPendingRefinements,
    pendingBattleCounts,
    markAsPending,
    updateFromProps
  } = usePendingRefinementsManager(pendingRefinements);
  
  const maxItems = getMaxItemsForTier();
  const displayRankings = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  // Update local state ONLY when the formattedRankings prop changes.
  // This prevents local drag-and-drop state from being overwritten.
  useEffect(() => {
    console.log(`🏆 [MILESTONE_DRAG_SYNC] Prop 'formattedRankings' changed, updating local rankings.`);
    // Apply name formatting when updating from props
    const formattedData = formattedRankings.map(pokemon => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name)
    }));
    setLocalRankings(formattedData);
  }, [formattedRankings]);

  // Enhanced manual reorder with proper callback that doesn't cause resets
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings as RankedPokemon[],
    (updatedRankings: RankedPokemon[]) => {
      console.log(`🏆 [MILESTONE_DRAG_FIXED] Enhanced reorder callback with ${updatedRankings.length} Pokemon`);
      // Ensure names stay formatted when reordering
      const formattedUpdatedRankings = updatedRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      setLocalRankings(formattedUpdatedRankings);
      // NOTE: Removed call to onManualReorder here to prevent reset conflicts
    },
    true // preventAutoResorting = true to maintain manual order
  );

  const handleLocalReorder = (reorderedSlice: (Pokemon | RankedPokemon)[]) => {
    const currentDisplayCount = displayRankings.length;
    const newFullRankings = [
      ...reorderedSlice,
      ...localRankings.slice(currentDisplayCount),
    ];
    setLocalRankings(newFullRankings);
  };

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

      {/* Draggable Grid Layout - DraggableMilestoneGrid handles its own DndContext */}
      <DraggableMilestoneGrid
        displayRankings={displayRankings}
        localPendingRefinements={localPendingRefinements}
        onManualReorder={handleEnhancedManualReorder}
        onLocalReorder={handleLocalReorder}
      />

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
