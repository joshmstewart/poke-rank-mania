
import React from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import MilestoneView from "./MilestoneView";
import DraggableMilestoneView from "./DraggableMilestoneView";
import StandardRankingView from "./StandardRankingView";
import { useRankingDisplayLogic } from "./RankingDisplayLogic";

interface RankingDisplayContainerProps {
  finalRankings: Pokemon[] | RankedPokemon[];
  battlesCompleted: number;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
  rankingGenerated: boolean;
  onSaveRankings: () => void;
  isMilestoneView?: boolean;
  activeTier?: TopNOption;
  onTierChange?: (tier: TopNOption) => void;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  pendingRefinements?: Set<number>;
  enableDragAndDrop?: boolean;
}

const RankingDisplayContainer: React.FC<RankingDisplayContainerProps> = ({
  finalRankings,
  battlesCompleted,
  onContinueBattles,
  onNewBattleSet,
  rankingGenerated,
  onSaveRankings,
  isMilestoneView = false,
  activeTier = 25,
  onTierChange,
  onSuggestRanking,
  onRemoveSuggestion,
  onManualReorder,
  pendingRefinements = new Set(),
  enableDragAndDrop = true
}) => {
  console.log("🔍 [CONTAINER_DEBUG] RankingDisplayContainer rendered");
  console.log("🔍 [CONTAINER_DEBUG] isMilestoneView:", isMilestoneView);
  console.log("🔍 [CONTAINER_DEBUG] enableDragAndDrop:", enableDragAndDrop);
  console.log("🔍 [CONTAINER_DEBUG] onManualReorder exists:", !!onManualReorder);
  console.log("🔍 [CONTAINER_DEBUG] onManualReorder type:", typeof onManualReorder);
  
  const {
    formattedRankings,
    displayCount,
    milestoneDisplayCount,
    getMaxItemsForTier,
    handleShowMore,
    handleMilestoneLoadMore
  } = useRankingDisplayLogic({
    finalRankings,
    isMilestoneView,
    activeTier
  });

  // DEBUG: Enhanced wrapper with comprehensive logging
  const handleManualReorderWithDebug = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔍 [CONTAINER_DEBUG] ===== MANUAL REORDER WRAPPER CALLED =====`);
    console.log(`🔍 [CONTAINER_DEBUG] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    console.log(`🔍 [CONTAINER_DEBUG] onManualReorder function available:`, !!onManualReorder);
    console.log(`🔍 [CONTAINER_DEBUG] onManualReorder type:`, typeof onManualReorder);
    
    if (onManualReorder && typeof onManualReorder === 'function') {
      console.log(`🔍 [CONTAINER_DEBUG] ===== CALLING ENHANCED LOGIC =====`);
      try {
        onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
        console.log(`🔍 [CONTAINER_DEBUG] ✅ Enhanced logic call completed`);
      } catch (error) {
        console.error(`🔍 [CONTAINER_DEBUG] ❌ Error in enhanced logic:`, error);
      }
    } else {
      console.error(`🔍 [CONTAINER_DEBUG] ❌ No manual reorder handler available or not a function!`);
      console.error(`🔍 [CONTAINER_DEBUG] ❌ Value:`, onManualReorder);
    }
    
    console.log(`🔍 [CONTAINER_DEBUG] ===== WRAPPER COMPLETE =====`);
  };

  if (isMilestoneView) {
    console.log("🔍 [CONTAINER_DEBUG] ===== MILESTONE VIEW SELECTED =====");
    console.log("🔍 [CONTAINER_DEBUG] Using DraggableMilestoneView (with drag and drop and info buttons)");
    
    return (
      <DraggableMilestoneView
        formattedRankings={formattedRankings}
        battlesCompleted={battlesCompleted}
        activeTier={activeTier}
        milestoneDisplayCount={milestoneDisplayCount}
        onContinueBattles={onContinueBattles}
        onLoadMore={handleMilestoneLoadMore}
        getMaxItemsForTier={getMaxItemsForTier}
        onManualReorder={handleManualReorderWithDebug}
        pendingRefinements={pendingRefinements}
      />
    );
  }

  return (
    <StandardRankingView
      formattedRankings={formattedRankings}
      displayCount={displayCount}
      battlesCompleted={battlesCompleted}
      rankingGenerated={rankingGenerated}
      onContinueBattles={onContinueBattles}
      onNewBattleSet={onNewBattleSet}
      onSaveRankings={onSaveRankings}
      onShowMore={handleShowMore}
    />
  );
};

export default RankingDisplayContainer;
