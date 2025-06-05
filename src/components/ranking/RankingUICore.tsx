
import React from "react";
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import { useRankingDragDrop } from "@/hooks/drag/useRankingDragDrop";
import { useReRankingTrigger } from "@/hooks/ranking/useReRankingTrigger";
import { useRankingReset } from "./RankingResetHandler";
import { EnhancedRankingLayout } from "./EnhancedRankingLayout";
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import PersistentLogViewer from "@/components/debug/PersistentLogViewer";

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

export const RankingUICore: React.FC<RankingUICoreProps> = React.memo(({
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
  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] ===== RENDERING =====`);
  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] localRankings count: ${localRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] enhancedAvailablePokemon count: ${enhancedAvailablePokemon.length}`);

  // Enhanced manual reorder with manual order preservation and direct TrueSkill updates
  const { handleEnhancedManualReorder, tooLarge } = useEnhancedManualReorder(
    localRankings,
    updateLocalRankings,
    true, // preventAutoResorting for Manual Mode
    undefined // No implied battle function needed
  );

  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] handleEnhancedManualReorder created:`, !!handleEnhancedManualReorder);

  // Re-ranking trigger for already-ranked Pokemon - FIXED: Remove try-catch around hook
  const { triggerReRanking } = useReRankingTrigger(localRankings, updateLocalRankings);
  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] triggerReRanking created:`, !!triggerReRanking);

  // Create a wrapper function to match the expected signature for useRankingDragDrop
  const triggerReRankingWrapper = React.useCallback(async (pokemonId: number) => {
    const pokemonToRerank = localRankings.filter(p => p.id === pokemonId);
    if (pokemonToRerank.length > 0) {
      triggerReRanking(pokemonToRerank);
    }
  }, [triggerReRanking, localRankings]);

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
  } = useRankingDragDrop({
    availablePokemon: enhancedAvailablePokemon,
    localRankings,
    setAvailablePokemon,
    onManualReorder: tooLarge ? (() => {}) : handleEnhancedManualReorder,
    triggerReRanking: triggerReRankingWrapper,
  });

  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] Drag handlers created:`, {
    handleDragStart: !!handleDragStart,
    handleDragEnd: !!handleDragEnd,
    handleManualReorder: !!handleManualReorder
  });

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
    console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] Local reorder called with ${newRankings.length} Pokemon`);
    updateLocalRankings(newRankings);
  };

  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] About to render EnhancedRankingLayout`);

  return (
    <>
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
      
      <PersistentLogViewer />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.localRankings.length === nextProps.localRankings.length &&
    prevProps.enhancedAvailablePokemon.length === nextProps.enhancedAvailablePokemon.length &&
    prevProps.selectedGeneration === nextProps.selectedGeneration &&
    prevProps.battleType === nextProps.battleType &&
    prevProps.isLoading === nextProps.isLoading
  );
});

RankingUICore.displayName = 'RankingUICore';
