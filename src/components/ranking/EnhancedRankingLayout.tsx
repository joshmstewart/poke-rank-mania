
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import { RankingsSectionStable } from "./RankingsSectionStable";
import { EnhancedAvailablePokemonSection } from "./EnhancedAvailablePokemonSection";
import { RankingsDroppableContainer } from "./RankingsDroppableContainer";
import { AvailablePokemonDroppableContainer } from "./AvailablePokemonDroppableContainer";
import UnifiedControls from "@/components/shared/UnifiedControls";
import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";
import { Card } from "@/components/ui/card";
import { useStableDragHandlers } from "@/hooks/battle/useStableDragHandlers";
import ScoreAdjustmentDebugModal from "./ScoreAdjustmentDebugModal";
import { DebugControls } from "./components/DebugControls";
import { useEnhancedDragHandlers } from "./hooks/useEnhancedDragHandlers";
import { ScoreDebugInfo } from "./types/debugTypes";
import PersistentLogViewer from "@/components/debug/PersistentLogViewer";

interface EnhancedRankingLayoutProps {
  isLoading: boolean;
  availablePokemon: any[];
  enhancedAvailablePokemon: any[];
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
  handleDragStart: (event: any) => void;
  handleDragEnd: (event: any) => void;
  handleManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  handleLocalReorder: (newRankings: any[]) => void;
}

export const EnhancedRankingLayout: React.FC<EnhancedRankingLayoutProps> = React.memo(({
  isLoading,
  availablePokemon,
  enhancedAvailablePokemon,
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
  // ITEM 4: Add verification log at top-level
  React.useEffect(() => {
    console.log("✅ [HOOK_DEBUG] EnhancedRankingLayout - useEffect hook executed successfully");
  }, []);

  console.log(`[LAYOUT_DEBUG] Enhanced Layout Render - Rankings: ${displayRankings.length}`);

  // Manual ranking order state for visual persistence
  const [manualRankingOrder, setManualRankingOrder] = useState(displayRankings);
  const [localAvailablePokemon, setLocalAvailablePokemon] = useState(enhancedAvailablePokemon);
  const { updateRating, getRating } = useTrueSkillStore();
  
  // Debug modal state
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState<ScoreDebugInfo[]>([]);

  // CRITICAL FIX: Memoize state updates to prevent excessive re-renders
  const updateManualRankingOrder = useCallback((newOrder: any[]) => {
    setManualRankingOrder(prev => {
      if (prev.length === newOrder.length && prev.every((p, i) => p.id === newOrder[i]?.id)) {
        return prev;
      }
      return newOrder;
    });
  }, []);

  const updateLocalAvailable = useCallback((newAvailable: any[]) => {
    setLocalAvailablePokemon(prev => {
      if (prev.length === newAvailable.length && prev.every((p, i) => p.id === newAvailable[i]?.id)) {
        return prev;
      }
      return newAvailable;
    });
  }, []);

  // Update states when props change (optimized)
  useEffect(() => {
    updateManualRankingOrder(displayRankings);
  }, [displayRankings, updateManualRankingOrder]);

  useEffect(() => {
    updateLocalAvailable(enhancedAvailablePokemon);
  }, [enhancedAvailablePokemon, updateLocalAvailable]);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    handleManualReorder,
    handleLocalReorder
  );

  const rankedPokemonIds = useMemo(() => 
    manualRankingOrder.map(pokemon => `sortable-ranking-${pokemon.id}`), 
    [manualRankingOrder]
  );

  // CRITICAL FIX: Remove all DnD Context logic from this component
  // The DndContext should only exist in the parent RankingUICore component
  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-7xl mx-auto mb-4">
        <UnifiedControls
          selectedGeneration={selectedGeneration}
          battleType={battleType}
          onGenerationChange={(gen) => onGenerationChange(Number(gen))}
          onBattleTypeChange={setBattleType}
          showBattleTypeControls={true}
          mode="manual"
          onReset={handleComprehensiveReset}
          customResetAction={handleComprehensiveReset}
        />
        
        <DebugControls onShowDebugModal={() => setShowDebugModal(true)} />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 12rem)' }}>
          <Card className="shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <AvailablePokemonDroppableContainer>
              <EnhancedAvailablePokemonSection
                enhancedAvailablePokemon={localAvailablePokemon}
                isLoading={isLoading}
                selectedGeneration={selectedGeneration}
                loadingType={loadingType}
                currentPage={currentPage}
                totalPages={totalPages}
                loadingRef={loadingRef}
                handlePageChange={handlePageChange}
                getPageRange={getPageRange}
              />
            </AvailablePokemonDroppableContainer>
          </Card>

          <Card className="shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <RankingsDroppableContainer>
              <SortableContext items={rankedPokemonIds} strategy={verticalListSortingStrategy}>
                <RankingsSectionStable
                  displayRankings={manualRankingOrder}
                  onManualReorder={stableOnManualReorder}
                  onLocalReorder={stableOnLocalReorder}
                  pendingRefinements={new Set()}
                  availablePokemon={localAvailablePokemon}
                />
              </SortableContext>
            </RankingsDroppableContainer>
          </Card>
        </div>
        
        {/* CRITICAL FIX: Remove DragOverlay from here - it should be in the parent DndContext */}
      </div>
      
      <ScoreAdjustmentDebugModal
        open={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        debugData={debugData}
      />
      
      <PersistentLogViewer />
    </div>
  );
});

EnhancedRankingLayout.displayName = 'EnhancedRankingLayout';
