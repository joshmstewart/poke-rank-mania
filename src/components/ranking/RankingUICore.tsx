
import React from "react";
import { DndContext, closestCorners, useSensor, useSensors, MouseSensor, TouchSensor, DragOverlay } from '@dnd-kit/core';
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import { useEnhancedRankingDragDrop } from "@/hooks/ranking/useEnhancedRankingDragDrop";
import { useReRankingTriggerSafe } from "@/hooks/ranking/useReRankingTriggerSafe";
import { useRankingReset } from "./RankingResetHandler";
import { EnhancedRankingLayout } from "./EnhancedRankingLayout";
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";
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
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings,
    updateLocalRankings,
    true, // preventAutoResorting for Manual Mode
    undefined // No implied battle function needed
  );

  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] handleEnhancedManualReorder created:`, !!handleEnhancedManualReorder);

  // CRITICAL FIX: Always call the safe re-ranking trigger hook
  const { triggerReRanking } = useReRankingTriggerSafe(localRankings, updateLocalRankings);
  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] triggerReRanking created successfully:`, !!triggerReRanking);

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

  // CRITICAL FIX: Setup sensors and DndContext at the TOP LEVEL with better collision detection
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  // CRITICAL FIX: Determine context from dragged item ID
  const getDraggedItemContext = React.useCallback((draggedPokemon: any): 'available' | 'ranked' => {
    if (!draggedPokemon) return 'ranked';
    
    // Check if this Pokemon exists in enhancedAvailablePokemon
    const isInAvailable = enhancedAvailablePokemon.some(p => p.id === draggedPokemon.id);
    console.log(`🔍 [CONTEXT_DEBUG] Pokemon ${draggedPokemon.name} found in available: ${isInAvailable}`);
    
    return isInAvailable ? 'available' : 'ranked';
  }, [enhancedAvailablePokemon]);

  console.log(`🚨🚨🚨 [RANKING_UI_CORE_DEBUG] About to render EnhancedRankingLayout with DndContext`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
      
      {/* CRITICAL FIX: Properly determine context for DragOverlay */}
      <DragOverlay>
        {activeDraggedPokemon ? (
          <div className="transform rotate-3 scale-105 opacity-90">
            <OptimizedDraggableCard
              pokemon={activeDraggedPokemon}
              index={0}
              showRank={false}
              isDraggable={false}
              context={getDraggedItemContext(activeDraggedPokemon)}
            />
          </div>
        ) : null}
      </DragOverlay>
      
      <PersistentLogViewer />
    </DndContext>
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
