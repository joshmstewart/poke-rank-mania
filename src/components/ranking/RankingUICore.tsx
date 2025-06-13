
import React from "react";
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import { useReRankingTrigger } from "@/hooks/ranking/useReRankingTrigger";
import { useRankingReset } from "./RankingResetHandler";
import { EnhancedRankingLayout } from "./EnhancedRankingLayout";
import { useOptimizedDragDrop } from "@/hooks/ranking/useOptimizedDragDrop";
import { useBackgroundTrueSkillProcessor } from "@/hooks/ranking/useBackgroundTrueSkillProcessor";
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
  // Background processor for heavy TrueSkill operations
  const { queueBackgroundOperation } = useBackgroundTrueSkillProcessor();

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

  // Use the optimized drag and drop with instant visual feedback
  const {
    sensors,
    activeDraggedPokemon,
    dragSourceInfo,
    handleDragStart,
    handleDragEnd
  } = useOptimizedDragDrop(
    enhancedAvailablePokemon,
    localRankings,
    setAvailablePokemon,
    updateLocalRankings,
    queueBackgroundOperation // Pass the background processor
  );

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
    updateLocalRankings(newRankings);
  };

  // Legacy manual reorder handler - now just queues background operation
  const handleManualReorder = (
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    // Queue for background processing instead of blocking UI
    queueBackgroundOperation(draggedPokemonId, sourceIndex, destinationIndex);
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
      sourceCardProps={null} // Simplified for performance
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
    />
  );
};
