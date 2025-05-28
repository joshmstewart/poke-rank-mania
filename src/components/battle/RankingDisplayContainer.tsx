
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
    // Use draggable milestone view if drag-and-drop is enabled
    if (enableDragAndDrop) {
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
    } else {
      // Fallback to original milestone view
      return (
        <MilestoneView
          formattedRankings={formattedRankings}
          battlesCompleted={battlesCompleted}
          activeTier={activeTier}
          milestoneDisplayCount={milestoneDisplayCount}
          onContinueBattles={onContinueBattles}
          onLoadMore={handleMilestoneLoadMore}
          getMaxItemsForTier={getMaxItemsForTier}
        />
      );
    }
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
