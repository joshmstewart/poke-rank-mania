
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
  // Enhanced manual reorder - always allow sorting
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings,
    updateLocalRankings,
    false // Never prevent auto-resorting in ranking mode
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
    sensors,
    activeDraggedPokemon,
    dragSourceInfo,
    sourceCardProps,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  } = useEnhancedRankingDragDrop(
    enhancedAvailablePokemon,
    localRankings,
    setAvailablePokemon,
    handleEnhancedManualReorder,
    triggerReRanking,
    updateLocalRankings
  );

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
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
      dragSourceInfo={dragSourceInfo}
      sourceCardProps={sourceCardProps}
      filteredAvailablePokemon={filteredAvailablePokemon}
      sensors={sensors}
      handlePageChange={handlePageChange}
      getPageRange={getPageRange}
      onGenerationChange={onGenerationChange}
      handleComprehensiveReset={handleComprehensiveReset}
      setBattleType={setBattleType}
      handleDragStart={handleDragStart}
      handleDragEnd={handleDragEnd}
      handleManualReorder={handleManualReorder}
      handleLocalReorder={handleLocalReorder}
      setAvailablePokemon={setAvailablePokemon}
      setRankedPokemon={setRankedPokemon}
    />
  );
};
