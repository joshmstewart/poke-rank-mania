
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
        return prev; // No change, prevent update
      }
      return newOrder;
    });
  }, []);

  const updateLocalAvailable = useCallback((newAvailable: any[]) => {
    setLocalAvailablePokemon(prev => {
      if (prev.length === newAvailable.length && prev.every((p, i) => p.id === newAvailable[i]?.id)) {
        return prev; // No change, prevent update
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

  // CRITICAL FIX: Memoize sensors to prevent recreation
  const sensors = useMemo(() => useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Increased distance to prevent accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  ), []);

  // CRITICAL FIX: Optimized drag end logic with minimal logging and efficient state updates
  const explicitHandleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    
    if (!active || !over) {
      console.log(`[DRAG_END] No active or over - aborting`);
      return;
    }

    const activeData = active.data?.current;
    const overData = over.data?.current;
    
    console.log(`[DRAG_END] ${activeData?.pokemon?.name} → ${over.id}`);
    
    // Determine move type efficiently
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

    // Handle Available → Ranked
    if (isAvailableToRanked && activeData?.pokemon) {
      console.log(`[POKEMON_MOVE] ${activeData.pokemon.name} → ranked`);
      
      // Single efficient state update
      setLocalAvailablePokemon(prev => prev.filter(p => p.id !== activeData.pokemon.id));
      
      setManualRankingOrder(prev => {
        let insertIndex = prev.length;
        if (overData?.type === 'ranked-pokemon' && overData?.index !== undefined) {
          insertIndex = overData.index;
        }
        const newRankings = [...prev];
        newRankings.splice(insertIndex, 0, activeData.pokemon);
        return newRankings;
      });
      
      console.log(`[POKEMON_MOVE] ✅ Move completed`);
      return;
    }

    // Handle Ranked → Available
    if (isRankedToAvailable && activeData?.pokemon) {
      console.log(`[POKEMON_MOVE] ${activeData.pokemon.name} → available`);
      
      // Single efficient state update
      setManualRankingOrder(prev => prev.filter(p => p.id !== activeData.pokemon.id));
      setLocalAvailablePokemon(prev => [...prev, activeData.pokemon]);
      
      console.log(`[POKEMON_MOVE] ✅ Move completed`);
      return;
    }

    // Handle Ranked Reorder
    if (isRankedReorder && activeData?.index !== undefined && overData?.index !== undefined) {
      console.log(`[POKEMON_REORDER] ${activeData.pokemon?.name}: ${activeData.index} → ${overData.index}`);
      
      setManualRankingOrder(prev => {
        const newRankings = [...prev];
        const [movedPokemon] = newRankings.splice(activeData.index, 1);
        newRankings.splice(overData.index, 0, movedPokemon);
        return newRankings;
      });
      
      console.log(`[POKEMON_REORDER] ✅ Reorder completed`);
      return;
    }

    console.log(`[DRAG_END] No valid move detected`);
  }, []);

  // CRITICAL FIX: Simplified collision detection
  const explicitCollisionDetection = useCallback((args: any) => {
    const collisions = closestCenter(args);
    if (collisions.length === 0) {
      console.log(`[COLLISION] No collisions`);
    }
    return collisions;
  }, []);

  // CRITICAL FIX: Minimal drag start logging
  const explicitHandleDragStart = useCallback((event: any) => {
    const activeData = event.active?.data?.current;
    console.log(`[DRAG_START] ${activeData?.pokemon?.name} (${activeData?.type})`);
    handleDragStart(event);
  }, [handleDragStart]);

  // Create sortable IDs for ranked Pokémon
  const rankedPokemonIds = useMemo(() => 
    manualRankingOrder.map(pokemon => `ranking-${pokemon.id}`), 
    [manualRankingOrder]
  );

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
