
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
  // ULTRA COMPREHENSIVE INPUT TRACKING
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] ===== RANKING UI COMPREHENSIVE INPUT AUDIT =====`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] PROPS RECEIVED:`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - availablePokemon: ${availablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - selectedGeneration: ${selectedGeneration}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - totalPages: ${totalPages}`);
  
  if (availablePokemon.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - availablePokemon sample IDs: ${availablePokemon.slice(0, 10).map(p => p.id).join(', ')}...`);
  }
  if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - rankedPokemon sample IDs: ${rankedPokemon.slice(0, 10).map(p => p.id).join(', ')}...`);
  }
  
  // Get TrueSkill data
  const { localRankings, updateLocalRankings } = useTrueSkillSync();
  
  // ULTRA COMPREHENSIVE TRUESKILL TRACKING
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] TRUESKILL SYNC OUTPUT:`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - localRankings from TrueSkill: ${localRankings.length}`);
  if (localRankings.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - localRankings sample IDs: ${localRankings.slice(0, 10).map(p => p.id).join(', ')}...`);
  }
  
  // Battle type state
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  // ULTRA COMPREHENSIVE DATA SOURCE COMPARISON
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] DATA SOURCE COMPARISON:`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - Props rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - TrueSkill localRankings: ${localRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - Which one should we use?`);
  
  // CRITICAL DECISION POINT: Which rankings to use?
  let displayRankings;
  if (localRankings.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] DECISION: Using TrueSkill localRankings (${localRankings.length} items)`);
    displayRankings = localRankings;
  } else if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] DECISION: Using props rankedPokemon (${rankedPokemon.length} items)`);
    displayRankings = rankedPokemon;
  } else {
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] DECISION: No rankings from either source`);
    displayRankings = [];
  }
  
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] FINAL DISPLAY RANKINGS: ${displayRankings.length}`);
  
  // Calculate filtered available Pokemon
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] FILTERING CALCULATION:`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - displayRankingsIds Set size: ${displayRankingsIds.size}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - Sample ranked IDs: ${[...displayRankingsIds].slice(0, 10).join(', ')}${displayRankingsIds.size > 10 ? '...' : ''}`);
  
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] FILTERING RESULT:`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - Original available: ${availablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - Filtered available: ${filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - Pokemon filtered out: ${availablePokemon.length - filteredAvailablePokemon.length}`);
  
  // ULTRA COMPREHENSIVE TOTAL CONSISTENCY CHECK
  const totalVisiblePokemon = displayRankings.length + filteredAvailablePokemon.length;
  const originalTotal = availablePokemon.length;
  
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] FINAL CONSISTENCY CHECK:`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - Display rankings: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - Filtered available: ${filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - TOTAL VISIBLE: ${totalVisiblePokemon}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - ORIGINAL TOTAL: ${originalTotal}`);
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] - CONSISTENCY: ${totalVisiblePokemon === originalTotal ? '✅ PASS' : '❌ FAIL'}`);
  
  if (totalVisiblePokemon !== originalTotal) {
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] ❌ CRITICAL: POKEMON COUNT MISMATCH!`);
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] ❌ Expected: ${originalTotal}, Got: ${totalVisiblePokemon}`);
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] ❌ Missing Pokemon: ${originalTotal - totalVisiblePokemon}`);
  }
  
  console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] ===== END COMPREHENSIVE AUDIT =====`);

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
    console.log(`🚨🚨🚨 [RANKING_UI_ULTRA] Local reorder called with ${newRankings.length} Pokemon`);
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
