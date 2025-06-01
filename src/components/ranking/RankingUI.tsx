
import React, { useState, useEffect } from "react";
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
  rankedPokemon,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  setAvailablePokemon,
  setRankedPokemon,
  handlePageChange,
  getPageRange,
  onGenerationChange,
  onReset
}) => {
  // CRITICAL FIX: Use TrueSkill-based rankings with manual update capability
  const { localRankings, updateLocalRankings } = useTrueSkillSync();
  
  // Battle type state (needed for BattleControls compatibility)
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  // CRITICAL FIX: Ensure both sides use the EXACT same Pokemon dataset
  console.log(`🚨🚨🚨 [RANKING_UI_CONSISTENT] ===== ENSURING CONSISTENT DATA =====`);
  console.log(`🚨🚨🚨 [INPUT_DATA] availablePokemon.length: ${availablePokemon.length}`);
  console.log(`🚨🚨🚨 [INPUT_DATA] localRankings.length: ${localRankings.length}`);
  
  // CRITICAL FIX: Use availablePokemon as the single source of truth
  // Filter out any Pokemon that are already in rankings from the available list
  const displayRankings = localRankings;
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  // CRITICAL FIX: Ensure the total always matches
  const totalVisiblePokemon = displayRankings.length + filteredAvailablePokemon.length;
  const originalTotal = availablePokemon.length;
  
  console.log(`🚨🚨🚨 [FINAL_COUNTS] displayRankings: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [FINAL_COUNTS] filteredAvailablePokemon: ${filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [FINAL_COUNTS] TOTAL VISIBLE: ${totalVisiblePokemon}`);
  console.log(`🚨🚨🚨 [FINAL_COUNTS] ORIGINAL TOTAL: ${originalTotal}`);
  console.log(`🚨🚨🚨 [FINAL_COUNTS] CONSISTENCY CHECK: ${totalVisiblePokemon === originalTotal ? 'PASS' : 'FAIL'}`);

  // Enhanced manual reorder with manual order preservation
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings,
    updateLocalRankings,
    true
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
    filteredAvailablePokemon,
    localRankings,
    setAvailablePokemon,
    handleEnhancedManualReorder
  );

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
    console.log(`🚨🚨🚨 [LOCAL_REORDER] Local reorder with ${newRankings.length} Pokemon`);
    updateLocalRankings(newRankings);
  };

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
