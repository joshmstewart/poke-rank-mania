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
    <div className="bg-card text-card-foreground rounded-lg border border-border p-3 sm:p-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <span className="text-2xl shrink-0">🏆</span>
          <h1 className="text-lg sm:text-xl font-bold truncate">
            Milestone: {battlesCompleted} Battles
          </h1>
          <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
            (Showing {displayRankings.length} of {activeTier === "All" ? maxItems : Math.min(Number(activeTier), maxItems)})
          </span>
          <AutoBattleLogsModal />
        </div>

        <Button
          onClick={onContinueBattles}
          className="ml-auto shrink-0 px-4 sm:px-6"
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
