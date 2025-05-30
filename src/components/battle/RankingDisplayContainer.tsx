
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
  console.log("🟣 RankingDisplayContainer component rendered with", finalRankings.length, "Pokémon");
  console.log("🎯 [DRAG_ENABLE_DEBUG] isMilestoneView:", isMilestoneView);
  console.log("🎯 [DRAG_ENABLE_DEBUG] enableDragAndDrop:", enableDragAndDrop);
  console.log("🎯 [DRAG_ENABLE_DEBUG] onManualReorder exists:", !!onManualReorder);
  
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

  // ENHANCED FIX: Wrapper that ensures the enhanced logic is called
  const handleManualReorderWrapper = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [ENHANCED_WRAPPER] ===== MANUAL REORDER WRAPPER =====`);
    console.log(`🔄 [ENHANCED_WRAPPER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    
    if (onManualReorder) {
      console.log(`🔄 [ENHANCED_WRAPPER] Calling enhanced manual reorder logic...`);
      onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    } else {
      console.error(`🔄 [ENHANCED_WRAPPER] ❌ No manual reorder handler available!`);
    }
    
    console.log(`🔄 [ENHANCED_WRAPPER] ===== WRAPPER COMPLETE =====`);
  };

  if (isMilestoneView) {
    console.log("🎯 [DRAG_ENABLE_DEBUG] ===== MILESTONE VIEW LOGIC =====");
    console.log("🎯 [DRAG_ENABLE_DEBUG] Should use draggable:", enableDragAndDrop);
    console.log("🎯 [DRAG_ENABLE_DEBUG] Manual reorder handler:", !!handleManualReorderWrapper);
    
    return (
      <DraggableMilestoneView
        formattedRankings={formattedRankings}
        battlesCompleted={battlesCompleted}
        activeTier={activeTier}
        milestoneDisplayCount={milestoneDisplayCount}
        onContinueBattles={onContinueBattles}
        onLoadMore={handleMilestoneLoadMore}
        getMaxItemsForTier={getMaxItemsForTier}
        onManualReorder={handleManualReorderWrapper}
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
