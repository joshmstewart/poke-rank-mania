
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
  // DETAILED LOGGING: Track input data
  console.log(`🚨🚨🚨 [RANKING_UI_DATA_INPUT] ===== RANKING UI RECEIVED DATA =====`);
  console.log(`🚨🚨🚨 [RANKING_UI_DATA_INPUT] Available Pokemon: ${availablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_DATA_INPUT] Available Pokemon IDs: ${availablePokemon.slice(0, 10).map(p => p.id).join(', ')}${availablePokemon.length > 10 ? '...' : ''}`);
  console.log(`🚨🚨🚨 [RANKING_UI_DATA_INPUT] Ranked Pokemon: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_DATA_INPUT] Selected Generation: ${selectedGeneration}`);
  console.log(`🚨🚨🚨 [RANKING_UI_DATA_INPUT] Total Pages: ${totalPages}`);
  
  // CRITICAL FIX: Use TrueSkill-based rankings with manual update capability
  const { localRankings, updateLocalRankings } = useTrueSkillSync();
  
  // DETAILED LOGGING: Track TrueSkill sync output
  console.log(`🚨🚨🚨 [RANKING_UI_TRUESKILL] ===== TRUESKILL SYNC OUTPUT =====`);
  console.log(`🚨🚨🚨 [RANKING_UI_TRUESKILL] localRankings from TrueSkill: ${localRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_TRUESKILL] First 10 localRankings IDs: ${localRankings.slice(0, 10).map(p => p.id).join(', ')}${localRankings.length > 10 ? '...' : ''}`);
  
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
  
  console.log(`🚨🚨🚨 [RANKING_UI_FILTER] ===== FILTERING AVAILABLE POKEMON =====`);
  console.log(`🚨🚨🚨 [RANKING_UI_FILTER] displayRankingsIds Set size: ${displayRankingsIds.size}`);
  console.log(`🚨🚨🚨 [RANKING_UI_FILTER] First 10 ranked IDs: ${[...displayRankingsIds].slice(0, 10).join(', ')}${displayRankingsIds.size > 10 ? '...' : ''}`);
  
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🚨🚨🚨 [RANKING_UI_FILTER] FILTER RESULT: ${filteredAvailablePokemon.length} Pokemon remaining after filtering ${availablePokemon.length} against ${displayRankingsIds.size} ranked IDs`);
  if (filteredAvailablePokemon.length === 0 && availablePokemon.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_UI_FILTER] ⚠️ CRITICAL: All ${availablePokemon.length} Pokemon filtered out! Sample IDs: ${availablePokemon.slice(0, 10).map(p => p.id).join(', ')}...`);
  }
  
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
