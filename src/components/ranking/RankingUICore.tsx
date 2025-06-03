
import React from "react";
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import { useEnhancedRankingDragDrop } from "@/hooks/ranking/useEnhancedRankingDragDrop";
import { useReRankingTrigger } from "@/hooks/ranking/useReRankingTrigger";
import { useRankingReset } from "./RankingResetHandler";
import { EnhancedRankingLayout } from "./EnhancedRankingLayout";
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";

interface RankingUICoreProps {
  isLoading: boolean;
  availablePokemon: any[];
  displayRankings: any[];
  filteredAvailablePokemon: any[];
  enhancedAvailablePokemon: any[];
  localRankings: any[];
  updateLocalRankings: (rankings: any[]) => void;
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  battleType: BattleType;
  setBattleType: React.Dispatch<React.SetStateAction<BattleType>>;
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>;
  setRankedPokemon: React.Dispatch<React.SetStateAction<any[]>>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
  onGenerationChange: (gen: number) => void;
  onReset: () => void;
}

export const RankingUICore: React.FC<RankingUICoreProps> = ({
  isLoading,
  availablePokemon,
  displayRankings,
  filteredAvailablePokemon,
  enhancedAvailablePokemon,
  localRankings,
  updateLocalRankings,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  battleType,
  setBattleType,
  setAvailablePokemon,
  setRankedPokemon,
  handlePageChange,
  getPageRange,
  onGenerationChange,
  onReset
}) => {
  console.log(`🚨🚨🚨 [ENHANCED_RANKING_UI_CORE] ===== ENHANCED RENDERING =====`);
  console.log(`🚨🚨🚨 [ENHANCED_RANKING_UI_CORE] Enhanced available Pokemon: ${enhancedAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [ENHANCED_RANKING_UI_CORE] Local rankings: ${localRankings.length}`);

  // Simple implied battle function for Manual Mode
  const addImpliedBattle = (winnerId: number, loserId: number) => {
    console.log(`🎲 [MANUAL_IMPLIED_BATTLE] Battle: ${winnerId} beats ${loserId}`);
    // For Manual Mode, we just log the battle - the TrueSkill updates happen in the reorder hook
  };

  // Enhanced manual reorder with manual order preservation and battle simulation
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings,
    updateLocalRankings,
    true, // preventAutoResorting for Manual Mode
    addImpliedBattle // Pass battle function for simulation
  );

  // Re-ranking trigger for already-ranked Pokemon
  const { triggerReRanking } = useReRankingTrigger(localRankings, updateLocalRankings);

  // Use the extracted reset functionality
  const { handleComprehensiveReset } = useRankingReset({
    onReset,
    setRankedPokemon
  });

  // Use the enhanced drag and drop functionality
  const {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  } = useEnhancedRankingDragDrop(
    enhancedAvailablePokemon,
    localRankings,
    setAvailablePokemon,
    handleEnhancedManualReorder,
    triggerReRanking
  );

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
    console.log(`🚨🚨🚨 [ENHANCED_RANKING_UI_CORE] Local reorder called with ${newRankings.length} Pokemon`);
    updateLocalRankings(newRankings);
  };

  return (
    <EnhancedRankingLayout
      isLoading={isLoading}
      availablePokemon={availablePokemon}
      enhancedAvailablePokemon={enhancedAvailablePokemon}
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
