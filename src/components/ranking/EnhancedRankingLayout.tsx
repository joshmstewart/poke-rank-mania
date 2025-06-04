
import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
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
  console.log(`[LAYOUT_DEBUG] ===== ENHANCED LAYOUT RENDER =====`);
  console.log(`[LAYOUT_DEBUG] displayRankings count: ${displayRankings.length}`);

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

  // CRITICAL FIX: Enhanced sensors with proper activation constraints
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  console.log(`[SENSORS_INIT] Mouse and Touch sensors initialized`);

  // CRITICAL FIX: Create sortable IDs only for ranked Pokemon
  const rankedPokemonIds = manualRankingOrder.map(pokemon => `ranking-${pokemon.id}`);

  console.log(`[SORTABLE_CONTEXT] Ranked Pokemon IDs:`, rankedPokemonIds.slice(0, 3));
  console.log(`[DRAGGABLE_CONTEXT] Available Pokemon count: ${enhancedAvailablePokemon.length}`);

  // CRITICAL FIX: Enhanced collision detection and debug logging
  const debugCollisionDetection = (args: any) => {
    console.log("[COLLISION_ARGS]", args);
    console.log("[COLLISION_ARGS] Active:", args.active);
    console.log("[COLLISION_ARGS] DroppableRects:", args.droppableRects);
    console.log("[COLLISION_ARGS] DroppableContainers:", args.droppableContainers);
    
    const collisionResults = closestCenter(args);
    
    console.log("[COLLISION_RESULTS]", collisionResults);
    
    if (collisionResults.length === 0) {
      console.log("[COLLISION_FAILURE] NO COLLISIONS DETECTED");
      console.log("[COLLISION_FAILURE] - Check if droppable areas are registered");
      console.log("[COLLISION_FAILURE] - Check CSS positioning and layout");
      console.log("[COLLISION_FAILURE] - Check if draggable overlaps droppable areas");
    } else {
      console.log("[COLLISION_SUCCESS] COLLISIONS FOUND:", collisionResults.map(c => c.id));
    }
    
    return collisionResults;
  };

  const debugOnDragStart = (event: any) => {
    console.log(`[DRAG_START] ===== DRAG START TRIGGERED =====`);
    console.log(`[DRAG_START] Active ID: ${event.active.id}`);
    console.log(`[DRAG_START] Active data:`, event.active.data.current);
    console.log(`[DRAG_START] Available Pokemon count: ${enhancedAvailablePokemon.length}`);
    console.log(`[DRAG_START] Rankings count: ${manualRankingOrder.length}`);
    console.log(`[DRAG_START] Is available Pokemon: ${event.active.id.toString().startsWith('available-')}`);
    console.log(`[DRAG_START] Is ranking Pokemon: ${event.active.id.toString().startsWith('ranking-')}`);
    
    // Call the enhanced handler
    enhancedHandleDragStart(event);
  };

  const debugOnDragOver = (event: any) => {
    if (event.over) {
      console.log(`[DRAG_OVER] ===== DRAG OVER COLLISION DETECTED =====`);
      console.log(`[DRAG_OVER] Active ID: ${event.active.id}`);
      console.log(`[DRAG_OVER] Over ID: ${event.over.id}`);
      console.log(`[DRAG_OVER] Active Type: ${event.active.data?.current?.type}`);
      console.log(`[DRAG_OVER] Over Type: ${event.over.data?.current?.type}`);
      console.log(`[DRAG_OVER] Over Accepts: ${event.over.data?.current?.accepts}`);
      console.log(`[DRAG_OVER] Cross-context interaction: ${event.active.id.toString().startsWith('available-') && (event.over.id === 'rankings-drop-zone' || event.over.id.toString().startsWith('ranking-'))}`);
      
      // EXPLICIT collision detection debugging for different targets
      if (event.active.id.toString().startsWith('available-')) {
        if (event.over.id === 'rankings-drop-zone') {
          console.log(`[DRAG_OVER] ✅ Available Pokemon ${event.active.id} colliding with rankings drop zone!`);
        } else if (event.over.id.toString().startsWith('ranking-')) {
          console.log(`[DRAG_OVER] ✅ Available Pokemon ${event.active.id} colliding with sortable ranking card ${event.over.id}!`);
        }
      }
    } else {
      console.log(`[DRAG_OVER] Dragging over NULL target`);
    }
  };

  const debugOnDragEnd = (event: any) => {
    console.log(`[DRAG_END] ===== DRAG END TRIGGERED =====`);
    console.log(`[DRAG_END] Active ID: ${event.active.id}`);
    console.log(`[DRAG_END] Over ID: ${event.over?.id || 'NULL'}`);
    console.log(`[DRAG_END] Active Type: ${event.active.data?.current?.type}`);
    console.log(`[DRAG_END] Over Type: ${event.over?.data?.current?.type || 'NULL'}`);
    console.log(`[DRAG_END] Is Available Card: ${event.active.id.toString().startsWith('available-')}`);
    console.log(`[DRAG_END] Is Rankings Drop Zone: ${event.over?.id === 'rankings-drop-zone'}`);
    console.log(`[DRAG_END] Is Sortable Card: ${event.over?.id?.toString().startsWith('ranking-')}`);
    console.log(`[DRAG_END] Cross-context drop detected: ${event.active.id.toString().startsWith('available-') && (event.over?.id === 'rankings-drop-zone' || event.over?.id?.toString().startsWith('ranking-'))}`);
    
    if (!event.over) {
      console.log(`[DRAG_END] ❌ NO DROP TARGET - this indicates collision detection failure`);
    } else if (event.over.id === 'rankings-drop-zone') {
      console.log(`[DRAG_END] ✅ SUCCESSFUL DROP ON RANKINGS ZONE!`);
    } else if (event.over.id.toString().startsWith('ranking-')) {
      console.log(`[DRAG_END] ✅ SUCCESSFUL DROP ON SORTABLE RANKING CARD!`);
    }
    
    // Call the enhanced handler
    enhancedHandleDragEnd(event);
  };

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
          sensors={sensors}
          collisionDetection={debugCollisionDetection}
          onDragStart={debugOnDragStart}
          onDragOver={debugOnDragOver}
          onDragEnd={debugOnDragEnd}
        >
          <div className="grid md:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 12rem)' }}>
            <Card className="shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              <AvailablePokemonDroppableContainer>
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
                    availablePokemon={enhancedAvailablePokemon}
                  />
                </SortableContext>
              </RankingsDroppableContainer>
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
