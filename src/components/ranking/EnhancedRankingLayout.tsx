
import React, { useMemo } from "react";
import { DndContext, DragOverlay, pointerWithin, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import { RankingsSectionStable } from "./RankingsSectionStable";
import { EnhancedAvailablePokemonSection } from "./EnhancedAvailablePokemonSection";
import UnifiedControls from "@/components/shared/UnifiedControls";
import PokemonCard from "@/components/PokemonCard";
import { Card } from "@/components/ui/card";
import { useStableDragHandlers } from "@/hooks/battle/useStableDragHandlers";

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
  console.log(`🔥🔥🔥 [LAYOUT_FIXED] ===== ENHANCED LAYOUT RENDER =====`);
  console.log(`🔥🔥🔥 [LAYOUT_FIXED] displayRankings count: ${displayRankings.length}`);
  console.log(`🔥🔥🔥 [LAYOUT_FIXED] handleManualReorder exists: ${!!handleManualReorder}`);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    handleManualReorder,
    handleLocalReorder
  );

  // STEP 2: Enhanced drag handlers with explicit string ID handling
  const enhancedHandleDragStart = (event: DragStartEvent) => {
    console.log(`🔧 [DRAG_FIX] Enhanced Drag Start - ID: ${event.active.id}`);
    const activeId = event.active.id.toString();
    console.log(`🔧 [DRAG_FIX] Active ID as string: ${activeId}`);
    handleDragStart(event);
  };

  const enhancedHandleDragEnd = (event: DragEndEvent) => {
    console.log(`🔧 [DRAG_FIX] Enhanced Drag End - Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    // STEP 2: Explicit string ID conversion for consistency
    const activeId = event.active.id.toString();
    const overId = event.over?.id?.toString();
    
    console.log(`🔧 [DRAG_FIX] IDs as strings - Active: ${activeId}, Over: ${overId}`);
    
    if (!event.over) {
      console.log(`🔧 [DRAG_FIX] No drop target detected`);
      return;
    }
    
    // Create enhanced event with string IDs for consistency
    const enhancedEvent = {
      ...event,
      active: {
        ...event.active,
        id: activeId
      },
      over: event.over ? {
        ...event.over,
        id: overId
      } : null
    };
    
    handleDragEnd(enhancedEvent);
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
      </div>

      <div className="max-w-7xl mx-auto">
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
            <DndContext
              collisionDetection={pointerWithin}
              onDragStart={enhancedHandleDragStart}
              onDragEnd={enhancedHandleDragEnd}
            >
              <RankingsSectionStable
                displayRankings={displayRankings}
                onManualReorder={stableOnManualReorder}
                onLocalReorder={stableOnLocalReorder}
                pendingRefinements={new Set()}
                availablePokemon={enhancedAvailablePokemon}
              />
              
              <DragOverlay>
                {activeDraggedPokemon ? (
                  <div className="transform rotate-3 scale-105 opacity-90">
                    <PokemonCard
                      pokemon={activeDraggedPokemon}
                      compact={true}
                      viewMode="grid"
                      isDragging={true}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </Card>
        </div>
      </div>
    </div>
  );
});

EnhancedRankingLayout.displayName = 'EnhancedRankingLayout';
