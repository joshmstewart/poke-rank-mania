
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
  // CRITICAL: Get TrueSkill-based rankings with manual update capability
  const { localRankings, updateLocalRankings } = useTrueSkillSync();
  
  // Battle type state (needed for BattleControls compatibility)
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  console.log(`🔥🔥🔥 [RANKING_UI_CRITICAL] ===== RANKING UI RENDER =====`);
  console.log(`🔥🔥🔥 [RANKING_UI_CRITICAL] Manual mode using TrueSkill rankings: ${localRankings.length} Pokemon`);
  console.log(`🔥🔥🔥 [RANKING_UI_CRITICAL] Ignoring separate rankedPokemon state: ${rankedPokemon.length}`);
  console.log(`🔥🔥🔥 [RANKING_UI_CRITICAL] Available Pokemon count: ${availablePokemon.length}`);

  // Enhanced manual reorder with manual order preservation
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings, // Use TrueSkill rankings
    updateLocalRankings, // Use the manual-mode-aware update function
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
    console.log(`🔥🔥🔥 [RANKING_UI_CRITICAL] Local reorder with ${newRankings.length} Pokemon`);
    updateLocalRankings(newRankings); // Use manual-mode-aware update
  };

  // CRITICAL: Use TrueSkill rankings as the single source of truth
  const displayRankings = localRankings;
  
  // CRITICAL: Filter available Pokemon to exclude those in the display rankings
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🔥🔥🔥 [RANKING_UI_CRITICAL] TrueSkill localRankings: ${localRankings.length}`);
  console.log(`🔥🔥🔥 [RANKING_UI_CRITICAL] displayRankings length: ${displayRankings.length}`);
  console.log(`🔥🔥🔥 [RANKING_UI_CRITICAL] Filtered available: ${filteredAvailablePokemon.length}`);
  console.log(`🔥🔥🔥 [RANKING_UI_CRITICAL] Display rankings IDs: ${Array.from(displayRankingsIds).slice(0, 10).join(', ')}${displayRankingsIds.size > 10 ? '...' : ''}`);

  // CRITICAL: Log data source validation
  useEffect(() => {
    console.log(`🔥🔥🔥 [RANKING_UI_DATA_SOURCE_CRITICAL] Data source validation:`);
    console.log(`🔥🔥🔥 [RANKING_UI_DATA_SOURCE_CRITICAL] TrueSkill localRankings: ${localRankings.length}`);
    console.log(`🔥🔥🔥 [RANKING_UI_DATA_SOURCE_CRITICAL] Legacy rankedPokemon (ignored): ${rankedPokemon.length}`);
    console.log(`🔥🔥🔥 [RANKING_UI_DATA_SOURCE_CRITICAL] Using displayRankings: ${displayRankings.length}`);
    
    if (localRankings.length > 0) {
      console.log(`🔥🔥🔥 [RANKING_UI_DATA_SOURCE_CRITICAL] First 3 rankings:`, localRankings.slice(0, 3).map(p => ({ id: p.id, name: p.name, score: p.score })));
    }
  }, [localRankings, rankedPokemon, displayRankings]);

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
