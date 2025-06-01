
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
  // CRITICAL: Get TrueSkill-based rankings with manual update capability
  const { localRankings, updateLocalRankings } = useTrueSkillSync();
  
  // Battle type state (needed for BattleControls compatibility)
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  // CRITICAL DEBUGGING: Add comprehensive data flow analysis
  console.log(`🚨🚨🚨 [RANKING_UI_DATA_INVESTIGATION] ===== COMPREHENSIVE DATA ANALYSIS =====`);
  console.log(`🚨🚨🚨 [INPUT_DATA] availablePokemon.length: ${availablePokemon.length}`);
  console.log(`🚨🚨🚨 [INPUT_DATA] rankedPokemon.length: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [INPUT_DATA] localRankings.length: ${localRankings.length}`);
  console.log(`🚨🚨🚨 [INPUT_DATA] Total from props: ${availablePokemon.length + rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [INPUT_DATA] Total with TrueSkill: ${availablePokemon.length + localRankings.length}`);
  
  // Log sample IDs to see what's missing
  if (availablePokemon.length > 0) {
    const availableIds = availablePokemon.map(p => p.id).slice(0, 10);
    console.log(`🚨🚨🚨 [AVAILABLE_SAMPLE] First 10 available IDs: ${availableIds.join(', ')}`);
  }
  
  if (localRankings.length > 0) {
    const rankedIds = localRankings.map(p => p.id).slice(0, 10);
    console.log(`🚨🚨🚨 [RANKED_SAMPLE] First 10 ranked IDs: ${rankedIds.join(', ')}`);
  }
  
  // Check for ID overlaps
  const availableIdSet = new Set(availablePokemon.map(p => p.id));
  const rankedIdSet = new Set(localRankings.map(p => p.id));
  const overlap = [...availableIdSet].filter(id => rankedIdSet.has(id));
  console.log(`🚨🚨🚨 [OVERLAP_CHECK] Overlapping Pokemon IDs: ${overlap.length}`);
  if (overlap.length > 0) {
    console.log(`🚨🚨🚨 [OVERLAP_DETAIL] Overlapping IDs: ${overlap.slice(0, 20).join(', ')}`);
  }
  
  // Check what generation filtering is doing
  console.log(`🚨🚨🚨 [GENERATION_FILTER] selectedGeneration: ${selectedGeneration}`);
  
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
    availablePokemon,
    localRankings,
    setAvailablePokemon,
    handleEnhancedManualReorder
  );

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
    console.log(`🚨🚨🚨 [LOCAL_REORDER] Local reorder with ${newRankings.length} Pokemon`);
    updateLocalRankings(newRankings);
  };

  // CRITICAL: Use TrueSkill rankings as the single source of truth
  const displayRankings = localRankings;
  
  // CRITICAL: Filter available Pokemon to exclude those in the display rankings
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🚨🚨🚨 [FINAL_COUNTS] displayRankings: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [FINAL_COUNTS] filteredAvailablePokemon: ${filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [FINAL_COUNTS] TOTAL VISIBLE: ${displayRankings.length + filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [FINAL_COUNTS] Expected from forms filtering: ???`);

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
