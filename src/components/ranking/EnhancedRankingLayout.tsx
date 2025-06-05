
import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import { RankingsSection } from "./RankingsSection";
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // CRITICAL FIX: Create sortable IDs for proper context separation
  const rankedPokemonIds = manualRankingOrder.map(pokemon => `ranking-${pokemon.id}`);
  const availablePokemonIds = enhancedAvailablePokemon.map(pokemon => `available-${pokemon.id}`);

  console.log(`🎯 [SORTABLE_CONTEXT] Ranked Pokemon IDs:`, rankedPokemonIds.slice(0, 3));
  console.log(`🎯 [SORTABLE_CONTEXT] Available Pokemon IDs:`, availablePokemonIds.slice(0, 3));

  // CRITICAL FIX: Enhanced collision detection and debug logging
  const debugOnDragStart = (event: any) => {
    console.log(`🎯 [DRAG_START_EVENT] ===== DRAG START TRIGGERED =====`);
    console.log(`🎯 [DRAG_START_EVENT] Active ID: ${event.active.id}`);
    console.log(`🎯 [DRAG_START_EVENT] Active data:`, event.active.data.current);
    console.log(`🎯 [DRAG_START_EVENT] Available Pokemon count: ${enhancedAvailablePokemon.length}`);
    console.log(`🎯 [DRAG_START_EVENT] Rankings count: ${manualRankingOrder.length}`);
    console.log(`🎯 [DRAG_START_EVENT] Is available Pokemon: ${event.active.id.toString().startsWith('available-')}`);
    console.log(`🎯 [DRAG_START_EVENT] Is ranking Pokemon: ${event.active.id.toString().startsWith('ranking-')}`);
    
    // Call the enhanced handler
    enhancedHandleDragStart(event);
  };

  const debugOnDragOver = (event: any) => {
    if (event.over) {
      console.log(`🔍 [COLLISION_DEBUG] ===== DRAG OVER COLLISION DETECTED =====`);
      console.log(`🔍 [COLLISION_DEBUG] Active ID: ${event.active.id}`);
      console.log(`🔍 [COLLISION_DEBUG] Over ID: ${event.over.id}`);
      console.log(`🔍 [COLLISION_DEBUG] Active Type: ${event.active.data?.current?.type}`);
      console.log(`🔍 [COLLISION_DEBUG] Over Type: ${event.over.data?.current?.type}`);
      console.log(`🔍 [COLLISION_DEBUG] Over Accepts: ${event.over.data?.current?.accepts}`);
      console.log(`🔍 [COLLISION_DEBUG] Collision strategy: closestCorners`);
      console.log(`🔍 [COLLISION_DEBUG] Cross-context interaction: ${event.active.id.toString().startsWith('available-') && (event.over.id === 'rankings-drop-zone' || event.over.id.toString().startsWith('ranking-'))}`);
      
      // EXPLICIT collision detection debugging for different targets
      if (event.active.id.toString().startsWith('available-')) {
        if (event.over.id === 'rankings-drop-zone') {
          console.log(`🔍 [COLLISION_DEBUG] ✅ Available Pokemon ${event.active.id} colliding with rankings drop zone!`);
        } else if (event.over.id.toString().startsWith('ranking-')) {
          console.log(`🔍 [COLLISION_DEBUG] ✅ Available Pokemon ${event.active.id} colliding with sortable ranking card ${event.over.id}!`);
        }
      }
    } else {
      console.log(`🔍 [COLLISION_DEBUG] Dragging over NULL target`);
    }
  };

  const debugOnDragEnd = (event: any) => {
    console.log(`🎯 [DRAG_END_EVENT] ===== DRAG END TRIGGERED =====`);
    console.log(`🎯 [DRAG_END_EVENT] Active ID: ${event.active.id}`);
    console.log(`🎯 [DRAG_END_EVENT] Over ID: ${event.over?.id || 'NULL'}`);
    console.log(`🎯 [DRAG_END_EVENT] Active Type: ${event.active.data?.current?.type}`);
    console.log(`🎯 [DRAG_END_EVENT] Over Type: ${event.over?.data?.current?.type || 'NULL'}`);
    console.log(`🎯 [DRAG_END_EVENT] Is Available Card: ${event.active.id.toString().startsWith('available-')}`);
    console.log(`🎯 [DRAG_END_EVENT] Is Rankings Drop Zone: ${event.over?.id === 'rankings-drop-zone'}`);
    console.log(`🎯 [DRAG_END_EVENT] Is Sortable Card: ${event.over?.id?.toString().startsWith('ranking-')}`);
    console.log(`🎯 [DRAG_END_EVENT] Cross-context drop detected: ${event.active.id.toString().startsWith('available-') && (event.over?.id === 'rankings-drop-zone' || event.over?.id?.toString().startsWith('ranking-'))}`);
    
    if (!event.over) {
      console.log(`🎯 [DRAG_END_EVENT] ❌ NO DROP TARGET - this indicates collision detection failure`);
    } else if (event.over.id === 'rankings-drop-zone') {
      console.log(`🎯 [DRAG_END_EVENT] ✅ SUCCESSFUL DROP ON RANKINGS ZONE!`);
    } else if (event.over.id.toString().startsWith('ranking-')) {
      console.log(`🎯 [DRAG_END_EVENT] ✅ SUCCESSFUL DROP ON SORTABLE RANKING CARD!`);
    }
    
    // CRITICAL FIX: Enhanced drag end logic with explicit type checking
    const activeType = event.active.data?.current?.type;
    const overType = event.over?.data?.current?.type;
    
    console.log(`🔥 [DRAG_LOGIC] Active type: ${activeType}, Over type: ${overType}`);
    
    if (activeType === 'available-pokemon' && (overType === 'ranked-pokemon' || event.over?.id === 'rankings-drop-zone')) {
      console.log('✅ [DRAG_LOGIC] Valid drop detected! Available Pokemon -> Rankings');
      const pokemon = event.active.data.current.pokemon;
      console.log(`🔥 [DRAG_LOGIC] Moving Pokemon: ${pokemon?.name} (ID: ${pokemon?.id})`);
    } else if (activeType === 'ranked-pokemon' && overType === 'ranked-pokemon') {
      console.log('✅ [DRAG_LOGIC] Valid reorder detected! Ranking Pokemon -> Ranking Pokemon');
    } else {
      console.log('⚠️ [DRAG_LOGIC] Invalid drop - types do not match expected patterns');
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
          collisionDetection={closestCorners}
          onDragStart={debugOnDragStart}
          onDragOver={debugOnDragOver}
          onDragEnd={debugOnDragEnd}
        >
          <div className="grid md:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 12rem)' }}>
            <Card className="shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              {/* CRITICAL FIX: Separate SortableContext for available Pokemon */}
              <SortableContext items={availablePokemonIds} strategy={rectSortingStrategy}>
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
              </SortableContext>
            </Card>

            <Card className="shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              {/* CRITICAL FIX: Use the corrected RankingsSection with individual droppable slots */}
              <RankingsSection 
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
