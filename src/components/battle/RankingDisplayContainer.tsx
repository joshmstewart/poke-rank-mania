
import React from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import { RefinementQueueProvider } from "./RefinementQueueProvider";
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

const RankingDisplayContainerInner: React.FC<RankingDisplayContainerProps> = ({
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

  // Handle manual reordering
  const handleManualReorder = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    
    if (onManualReorder) {
      onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    }
  };

  if (isMilestoneView) {
    console.log("🎯 [DRAG_ENABLE_DEBUG] ===== MILESTONE VIEW LOGIC =====");
    console.log("🎯 [DRAG_ENABLE_DEBUG] Should use draggable:", enableDragAndDrop);
    console.log("🎯 [DRAG_ENABLE_DEBUG] Manual reorder handler:", !!handleManualReorder);
    
    // ALWAYS use draggable milestone view in milestone mode
    return (
      <DraggableMilestoneView
        formattedRankings={formattedRankings}
        battlesCompleted={battlesCompleted}
        activeTier={activeTier}
        milestoneDisplayCount={milestoneDisplayCount}
        onContinueBattles={onContinueBattles}
        onLoadMore={handleMilestoneLoadMore}
        getMaxItemsForTier={getMaxItemsForTier}
        onManualReorder={handleManualReorder}
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

const RankingDisplayContainer: React.FC<RankingDisplayContainerProps> = (props) => {
  console.log(`🔄 [REFINEMENT_PROVIDER_RANKING] Wrapping RankingDisplayContainer with RefinementQueueProvider`);
  return (
    <RefinementQueueProvider>
      <RankingDisplayContainerInner {...props} />
    </RefinementQueueProvider>
  );
};

export default RankingDisplayContainer;
