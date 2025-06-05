import React from "react";
import { LoadingState } from "./LoadingState";
import { DragDropRankingLayout } from "./DragDropRankingLayout";
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import { ITEMS_PER_PAGE } from "@/services/pokemon";

interface RankingLayoutProps {
  isLoading: boolean;
  availablePokemon: any[];
  displayRankings: any[];
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  battleType: BattleType;
  activeDraggedPokemon: any;
  filteredAvailablePokemon: any[];
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
  onGenerationChange: (gen: number) => void;
  handleComprehensiveReset: () => void;
  setBattleType: React.Dispatch<React.SetStateAction<BattleType>>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  handleLocalReorder: (newRankings: any[]) => void;
}

export const RankingLayout: React.FC<RankingLayoutProps> = ({
  isLoading,
  availablePokemon,
  displayRankings,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  battleType,
  activeDraggedPokemon,
  filteredAvailablePokemon,
  handlePageChange,
  getPageRange,
  onGenerationChange,
  handleComprehensiveReset,
  setBattleType,
  handleDragStart,
  handleDragEnd,
  handleManualReorder,
  handleLocalReorder
}) => {
  if (isLoading && availablePokemon.length === 0) {
    return (
      <LoadingState 
        selectedGeneration={selectedGeneration} 
        loadSize={loadSize} 
        itemsPerPage={ITEMS_PER_PAGE}
        loadingType={loadingType}
      />
    );
  }

  console.log(`[LAYOUT] Rendering with ${filteredAvailablePokemon.length} available and ${displayRankings.length} ranked Pokemon`);

  return (
    <DragDropRankingLayout
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
      filteredAvailablePokemon={filteredAvailablePokemon}
      handlePageChange={handlePageChange}
      getPageRange={getPageRange}
      onGenerationChange={onGenerationChange}
      handleComprehensiveReset={handleComprehensiveReset}
      setBattleType={setBattleType}
      handleManualReorder={handleManualReorder}
      handleLocalReorder={handleLocalReorder}
    />
  );
};
