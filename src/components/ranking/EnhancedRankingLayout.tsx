
import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import { RankingsSectionStable } from "./RankingsSectionStable";
import { EnhancedAvailablePokemonSection } from "./EnhancedAvailablePokemonSection";
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
  console.log(`🔥🔥🔥 [LAYOUT_DEBUG] ===== ENHANCED LAYOUT RENDER =====`);
  console.log(`🔥🔥🔥 [LAYOUT_DEBUG] displayRankings count: ${displayRankings.length}`);
  console.log(`🔥🔥🔥 [LAYOUT_DEBUG] enhancedAvailablePokemon count: ${enhancedAvailablePokemon.length}`);

  // Manual ranking order state for visual persistence
  const [manualRankingOrder, setManualRankingOrder] = useState(displayRankings);
  const { updateRating, getRating } = useTrueSkillStore();
  
  // Debug modal state
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState<ScoreDebugInfo[]>([]);
  
  // Update manual order when displayRankings changes
  useEffect(() => {
    setManualRankingOrder(displayRankings);
  }, [displayRankings]);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    handleManualReorder,
    handleLocalReorder
  );

  // Use enhanced drag handlers
  const { enhancedHandleDragStart, enhancedHandleDragEnd } = useEnhancedDragHandlers({
    manualRankingOrder,
    setManualRankingOrder,
    handleDragStart,
    handleDragEnd,
    handleManualReorder,
    updateRating,
    getRating,
    setDebugData
  });

  // ENHANCED DEBUG HANDLERS WITH EXPLICIT LOGGING
  const debugOnDragStart = (event: any) => {
    console.log(`🎯 [DRAG_START_EVENT] ===== DRAG START TRIGGERED =====`);
    console.log(`🎯 [DRAG_START_EVENT] Event timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 [DRAG_START_EVENT] Active ID: ${event.active.id}`);
    console.log(`🎯 [DRAG_START_EVENT] Active data:`, event.active.data.current);
    console.log(`🎯 [DRAG_START_EVENT] Is available card: ${event.active.id.toString().startsWith('available-')}`);
    console.log(`🎯 [DRAG_START_EVENT] Is ranking card: ${event.active.id.toString().startsWith('ranking-')}`);
    console.log(`🎯 [DRAG_START_EVENT] Available Pokemon count: ${enhancedAvailablePokemon.length}`);
    console.log(`🎯 [DRAG_START_EVENT] Rankings count: ${manualRankingOrder.length}`);
    
    // Test: log active pokemon info if available
    if (event.active.data.current?.pokemon) {
      console.log(`🎯 [DRAG_START_EVENT] Pokemon being dragged: ${event.active.data.current.pokemon.name}`);
      console.log(`🎯 [DRAG_START_EVENT] Pokemon ID: ${event.active.data.current.pokemon.id}`);
      console.log(`🎯 [DRAG_START_EVENT] Pokemon source: ${event.active.data.current.source}`);
    }
    
    enhancedHandleDragStart(event);
  };

  const debugOnDragOver = (event: any) => {
    console.log(`🔍 [COLLISION_DEBUG] ===== DRAG OVER COLLISION DETECTED =====`);
    console.log(`🔍 [COLLISION_DEBUG] Event timestamp: ${new Date().toISOString()}`);
    console.log(`🔍 [COLLISION_DEBUG] Active ID: ${event.active.id}`);
    console.log(`🔍 [COLLISION_DEBUG] Over ID: ${event.over?.id || 'NULL'}`);
    console.log(`🔍 [COLLISION_DEBUG] Over data:`, event.over?.data?.current);
    console.log(`🔍 [COLLISION_DEBUG] Collision strategy: closestCorners`);
    console.log(`🔍 [COLLISION_DEBUG] Active -> Over: ${event.active.id} -> ${event.over?.id || 'NULL'}`);
    
    // Additional collision debugging
    if (event.over) {
      console.log(`🔍 [COLLISION_DEBUG] Valid collision detected between ${event.active.id} and ${event.over.id}`);
      console.log(`🔍 [COLLISION_DEBUG] Over element type: ${event.over.data?.current?.type || 'unknown'}`);
    } else {
      console.log(`🔍 [COLLISION_DEBUG] No collision target found for ${event.active.id}`);
    }
  };

  const debugOnDragEnd = (event: any) => {
    console.log(`🎯 [DRAG_END_EVENT] ===== DRAG END TRIGGERED =====`);
    console.log(`🎯 [DRAG_END_EVENT] Event timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 [DRAG_END_EVENT] Active ID: ${event.active.id}`);
    console.log(`🎯 [DRAG_END_EVENT] Over ID: ${event.over?.id || 'NULL'}`);
    console.log(`🎯 [DRAG_END_EVENT] Is Available Card: ${event.active.id.toString().startsWith('available-')}`);
    console.log(`🎯 [DRAG_END_EVENT] Is Ranking Target: ${event.over?.id?.toString().startsWith('ranking-') || event.over?.id === 'rankings-drop-zone'}`);
    console.log(`🎯 [DRAG_END_EVENT] Drop successful: ${!!event.over}`);
    
    // Log dragged pokemon info
    if (event.active.data.current?.pokemon) {
      console.log(`🎯 [DRAG_END_EVENT] Dragged Pokemon: ${event.active.data.current.pokemon.name}`);
      console.log(`🎯 [DRAG_END_EVENT] Dragged Pokemon ID: ${event.active.data.current.pokemon.id}`);
    }
    
    // Log drop target info
    if (event.over?.data?.current?.pokemon) {
      console.log(`🎯 [DRAG_END_EVENT] Drop target Pokemon: ${event.over.data.current.pokemon.name}`);
      console.log(`🎯 [DRAG_END_EVENT] Drop target Pokemon ID: ${event.over.data.current.pokemon.id}`);
    } else if (event.over?.id === 'rankings-drop-zone') {
      console.log(`🎯 [DRAG_END_EVENT] Dropped on rankings drop zone`);
    }
    
    enhancedHandleDragEnd(event);
  };

  console.log(`🔥🔥🔥 [LAYOUT_DEBUG] About to render DndContext with enhanced debugging`);

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
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={debugOnDragStart}
          onDragOver={debugOnDragOver}
          onDragEnd={debugOnDragEnd}
        >
          <div className="grid md:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 12rem)' }}>
            <Card className="shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              <EnhancedAvailablePokemonSection
                enhancedAvailablePokemon={enhancedAvailablePokemon}
                isLoading={isLoading}
                selectedGeneration={selectedGeneration}
                loadingType={loadingType}
                currentPage={currentPage}
                totalPages={totalPages}
                loadingRef={loadingRef}
                handlePageChange={handlePageChange}
                getPageRange={getPageRange}
              />
            </Card>

            <Card className="shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              <RankingsSectionStable
                displayRankings={manualRankingOrder}
                onManualReorder={stableOnManualReorder}
                onLocalReorder={stableOnLocalReorder}
                pendingRefinements={new Set()}
                availablePokemon={enhancedAvailablePokemon}
              />
            </Card>
          </div>
          
          <DragOverlay>
            {activeDraggedPokemon ? (
              <div className="transform rotate-3 scale-105 opacity-90">
                <OptimizedDraggableCard
                  pokemon={activeDraggedPokemon}
                  index={0}
                  showRank={false}
                  isDraggable={false}
                  context={activeDraggedPokemon.id?.toString().startsWith('available-') ? 'available' : 'ranked'}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
