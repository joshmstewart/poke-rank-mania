
import React, { useState } from "react";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { BattleType } from "@/hooks/battle/types";
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import { useRankingDragDrop } from "@/hooks/ranking/useRankingDragDrop";
import { useRankingReset } from "./RankingResetHandler";
import { RankingLayout } from "./RankingLayout";

interface RankingUIProps {
  isLoading: boolean;
  availablePokemon: any[];
  rankedPokemon: any[];
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>;
  setRankedPokemon: React.Dispatch<React.SetStateAction<any[]>>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
  onGenerationChange: (gen: number) => void;
  onReset: () => void;
}

export const RankingUI: React.FC<RankingUIProps> = ({
  isLoading,
  availablePokemon,
  rankedPokemon, // This will be ignored in favor of TrueSkill rankings
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  setAvailablePokemon,
  setRankedPokemon, // This will be ignored in favor of TrueSkill rankings
  handlePageChange,
  getPageRange,
  onGenerationChange,
  onReset
}) => {
  // Get TrueSkill-based rankings - this is the ONLY source of truth
  const { localRankings } = useTrueSkillSync();
  
  // Battle type state (needed for BattleControls compatibility)
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  console.log(`🔥 [RANKING_UI_REFACTORED] Manual mode using TrueSkill rankings: ${localRankings.length} Pokemon`);
  console.log(`🔥 [RANKING_UI_REFACTORED] Ignoring separate rankedPokemon state: ${rankedPokemon.length}`);

  // Enhanced manual reorder with fake battles (preserving the existing system)
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings, // Use TrueSkill rankings, not separate state
    (newRankings) => {
      console.log(`🔥 [RANKING_UI_REFACTORED] Manual reorder completed with ${newRankings.length} Pokemon`);
      // Note: We don't update setRankedPokemon anymore since we use TrueSkill
    },
    true // preventAutoResorting = true to maintain manual order
  );

  // Use the extracted reset functionality
  const { handleComprehensiveReset } = useRankingReset({
    onReset,
    setRankedPokemon
  });

  // Use the extracted drag and drop functionality
  const {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  } = useRankingDragDrop(
    availablePokemon,
    localRankings,
    setAvailablePokemon,
    handleEnhancedManualReorder
  );

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
    console.log(`🔥 [RANKING_UI_REFACTORED] Local reorder with ${newRankings.length} Pokemon`);
    // Note: We don't update local state since we use TrueSkill rankings
  };

  // Use TrueSkill rankings as the single source of truth
  const displayRankings = localRankings;
  
  // Filter available Pokemon to exclude those in the display rankings
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🔥 [RANKING_UI_REFACTORED] TrueSkill localRankings: ${localRankings.length}`);
  console.log(`🔥 [RANKING_UI_REFACTORED] displayRankings length: ${displayRankings.length}`);
  console.log(`🔥 [RANKING_UI_REFACTORED] Filtered available: ${filteredAvailablePokemon.length}`);

  return (
    <RankingLayout
      isLoading={isLoading}
      availablePokemon={availablePokemon}
      displayRankings={displayRankings}
      selectedGeneration={selectedGeneration}
      loadingType={loadingType}
      currentPage={currentPage}
      totalPages={totalPages}
      loadSize={loadSize}
      loadingRef={loadingRef}
      battleType={battleType}
      activeDraggedPokemon={activeDraggedPokemon}
      filteredAvailablePokemon={filteredAvailablePokemon}
      handlePageChange={handlePageChange}
      getPageRange={getPageRange}
      onGenerationChange={onGenerationChange}
      handleComprehensiveReset={handleComprehensiveReset}
      setBattleType={setBattleType}
      handleDragStart={handleDragStart}
      handleDragEnd={handleDragEnd}
      handleManualReorder={handleManualReorder}
      handleLocalReorder={handleLocalReorder}
    />
  );
};
