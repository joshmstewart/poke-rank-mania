
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
  const [localAvailablePokemon, setLocalAvailablePokemon] = useState(enhancedAvailablePokemon);
  const { updateRating, getRating } = useTrueSkillStore();
  
  // Debug modal state
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState<ScoreDebugInfo[]>([]);
  
  // Update states when props change
  useEffect(() => {
    setManualRankingOrder(displayRankings);
  }, [displayRankings]);

  useEffect(() => {
    setLocalAvailablePokemon(enhancedAvailablePokemon);
  }, [enhancedAvailablePokemon]);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    handleManualReorder,
    handleLocalReorder
  );

  // Enhanced sensors with proper activation constraints
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  console.log(`[SENSORS_INIT] Mouse and Touch sensors initialized with constraints`);

  // EXPLICIT DRAG END LOGIC WITH DETAILED LOGGING
  const explicitHandleDragEnd = (event: any) => {
    const { active, over } = event;
    
    console.log(`[EXPLICIT_DRAG_END] ===== EXPLICIT DRAG END HANDLER =====`);
    console.log(`[EXPLICIT_DRAG_END] Active ID: ${active?.id || 'NULL'}`);
    console.log(`[EXPLICIT_DRAG_END] Over ID: ${over?.id || 'NULL'}`);
    
    if (!active || !over) {
      console.log(`[EXPLICIT_DRAG_END] ❌ Missing active or over - aborting`);
      console.log(`[EXPLICIT_DRAG_END] Active exists: ${!!active}`);
      console.log(`[EXPLICIT_DRAG_END] Over exists: ${!!over}`);
      return;
    }

    // Extract data with detailed logging
    const activeData = active.data?.current;
    const overData = over.data?.current;
    
    console.log(`[EXPLICIT_DRAG_END] ===== ACTIVE DATA ANALYSIS =====`);
    console.log(`[EXPLICIT_DRAG_END] Active data exists: ${!!activeData}`);
    console.log(`[EXPLICIT_DRAG_END] Active data:`, activeData);
    console.log(`[EXPLICIT_DRAG_END] Active type: ${activeData?.type}`);
    console.log(`[EXPLICIT_DRAG_END] Active pokemon: ${activeData?.pokemon?.name} (ID: ${activeData?.pokemon?.id})`);
    console.log(`[EXPLICIT_DRAG_END] Active source: ${activeData?.source}`);
    console.log(`[EXPLICIT_DRAG_END] Active index: ${activeData?.index}`);
    
    console.log(`[EXPLICIT_DRAG_END] ===== OVER DATA ANALYSIS =====`);
    console.log(`[EXPLICIT_DRAG_END] Over data exists: ${!!overData}`);
    console.log(`[EXPLICIT_DRAG_END] Over data:`, overData);
    console.log(`[EXPLICIT_DRAG_END] Over type: ${overData?.type}`);
    console.log(`[EXPLICIT_DRAG_END] Over accepts: ${overData?.accepts}`);
    console.log(`[EXPLICIT_DRAG_END] Over source: ${overData?.source}`);

    // Determine if this is a cross-context move
    const isAvailableToRanked = activeData?.type === 'available-pokemon' && 
                               (overData?.type === 'rankings-container' || 
                                overData?.type === 'ranked-pokemon' ||
                                over.id === 'rankings-drop-zone');
    
    const isRankedToAvailable = activeData?.type === 'ranked-pokemon' && 
                               (overData?.type === 'available-container' ||
                                over.id === 'available-pokemon-drop-zone');
    
    const isRankedReorder = activeData?.type === 'ranked-pokemon' && 
                           overData?.type === 'ranked-pokemon' &&
                           activeData?.source === 'ranked' && 
                           overData?.source === 'ranked';

    console.log(`[EXPLICIT_DRAG_END] ===== MOVE TYPE ANALYSIS =====`);
    console.log(`[EXPLICIT_DRAG_END] Is Available→Ranked: ${isAvailableToRanked}`);
    console.log(`[EXPLICIT_DRAG_END] Is Ranked→Available: ${isRankedToAvailable}`);
    console.log(`[EXPLICIT_DRAG_END] Is Ranked Reorder: ${isRankedReorder}`);

    // Handle Available → Ranked
    if (isAvailableToRanked && activeData?.pokemon) {
      console.log(`[POKEMON_MOVE] ===== MOVING AVAILABLE TO RANKED =====`);
      console.log(`[POKEMON_MOVE] Moving ${activeData.pokemon.name} (ID: ${activeData.pokemon.id}) to ranked`);
      
      // Remove from available
      setLocalAvailablePokemon(prev => {
        const updated = prev.filter(p => p.id !== activeData.pokemon.id);
        console.log(`[POKEMON_MOVE] ✅ Removed from available. Count: ${prev.length} → ${updated.length}`);
        return updated;
      });
      
      // Add to ranked at appropriate position
      setManualRankingOrder(prev => {
        let newRankings;
        
        // Determine insertion position
        if (overData?.type === 'ranked-pokemon' && overData?.index !== undefined) {
          // Insert before the target Pokémon
          newRankings = [...prev];
          newRankings.splice(overData.index, 0, activeData.pokemon);
          console.log(`[POKEMON_MOVE] ✅ Inserted at position ${overData.index} (before ${prev[overData.index]?.name})`);
        } else {
          // Add to end
          newRankings = [...prev, activeData.pokemon];
          console.log(`[POKEMON_MOVE] ✅ Added to end of rankings`);
        }
        
        console.log(`[POKEMON_MOVE] ✅ Rankings updated. Count: ${prev.length} → ${newRankings.length}`);
        return newRankings;
      });
      
      console.log(`[POKEMON_MOVE] ✅ MOVE COMPLETED: ${activeData.pokemon.name} is now ranked`);
      return;
    }

    // Handle Ranked → Available
    if (isRankedToAvailable && activeData?.pokemon) {
      console.log(`[POKEMON_MOVE] ===== MOVING RANKED TO AVAILABLE =====`);
      console.log(`[POKEMON_MOVE] Moving ${activeData.pokemon.name} (ID: ${activeData.pokemon.id}) to available`);
      
      // Remove from ranked
      setManualRankingOrder(prev => {
        const updated = prev.filter(p => p.id !== activeData.pokemon.id);
        console.log(`[POKEMON_MOVE] ✅ Removed from ranked. Count: ${prev.length} → ${updated.length}`);
        return updated;
      });
      
      // Add back to available
      setLocalAvailablePokemon(prev => {
        const updated = [...prev, activeData.pokemon];
        console.log(`[POKEMON_MOVE] ✅ Added back to available. Count: ${prev.length} → ${updated.length}`);
        return updated;
      });
      
      console.log(`[POKEMON_MOVE] ✅ MOVE COMPLETED: ${activeData.pokemon.name} is now available`);
      return;
    }

    // Handle Ranked Reorder
    if (isRankedReorder && activeData?.index !== undefined && overData?.index !== undefined) {
      console.log(`[POKEMON_REORDER] ===== REORDERING WITHIN RANKED =====`);
      console.log(`[POKEMON_REORDER] Moving ${activeData.pokemon?.name} from index ${activeData.index} to ${overData.index}`);
      
      setManualRankingOrder(prev => {
        const newRankings = [...prev];
        const [movedPokemon] = newRankings.splice(activeData.index, 1);
        newRankings.splice(overData.index, 0, movedPokemon);
        
        console.log(`[POKEMON_REORDER] ✅ REORDER COMPLETED: ${movedPokemon.name} moved to position ${overData.index}`);
        return newRankings;
      });
      return;
    }

    console.log(`[EXPLICIT_DRAG_END] ❌ NO VALID MOVE TYPE DETECTED - ignoring drag`);
  };

  // Enhanced collision detection with detailed logging
  const explicitCollisionDetection = (args: any) => {
    console.log(`[COLLISION_DETECTION] ===== COLLISION DETECTION =====`);
    console.log(`[COLLISION_DETECTION] Active:`, args.active);
    console.log(`[COLLISION_DETECTION] Droppable containers:`, args.droppableContainers?.size || 0);
    console.log(`[COLLISION_DETECTION] Droppable rects:`, Object.keys(args.droppableRects || {}));
    
    const collisions = closestCenter(args);
    
    console.log(`[COLLISION_DETECTION] Collisions found: ${collisions.length}`);
    if (collisions.length > 0) {
      console.log(`[COLLISION_DETECTION] ✅ Collision targets:`, collisions.map(c => c.id));
    } else {
      console.log(`[COLLISION_DETECTION] ❌ No collisions detected`);
    }
    
    return collisions;
  };

  // Enhanced drag start with detailed logging
  const explicitHandleDragStart = (event: any) => {
    console.log(`[EXPLICIT_DRAG_START] ===== EXPLICIT DRAG START =====`);
    console.log(`[EXPLICIT_DRAG_START] Active ID: ${event.active?.id}`);
    console.log(`[EXPLICIT_DRAG_START] Active data:`, event.active?.data?.current);
    
    const activeData = event.active?.data?.current;
    if (activeData?.pokemon) {
      console.log(`[EXPLICIT_DRAG_START] ✅ Dragging ${activeData.pokemon.name} (Type: ${activeData.type}, Source: ${activeData.source})`);
    }
    
    // Call the original handler
    handleDragStart(event);
  };

  // Create sortable IDs for ranked Pokémon
  const rankedPokemonIds = manualRankingOrder.map(pokemon => `ranking-${pokemon.id}`);

  console.log(`[SORTABLE_CONTEXT] Ranked Pokemon IDs count: ${rankedPokemonIds.length}`);
  console.log(`[DRAGGABLE_CONTEXT] Available Pokemon count: ${localAvailablePokemon.length}`);

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
          collisionDetection={explicitCollisionDetection}
          onDragStart={explicitHandleDragStart}
          onDragEnd={explicitHandleDragEnd}
        >
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
