import React from "react";
import { DndContext, DragOverlay, closestCenter, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { LoadingState } from "./LoadingState";
import { AvailablePokemonSection } from "./AvailablePokemonSection";
import { RankingsSection } from "./RankingsSection";
import BattleControls from "@/components/battle/BattleControls";
import PokemonCard from "@/components/PokemonCard";
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
  // CRITICAL FIX: Enhanced drag event logging with proper event detection
  const enhancedHandleDragStart = (event: DragStartEvent) => {
    console.log(`🚨🚨🚨 [LAYOUT_DRAG_START_DETECTED] ===== DRAG START DETECTED =====`);
    console.log(`🚨🚨🚨 [LAYOUT_DRAG_START_ID] Active ID: ${event.active.id}`);
    console.log(`🚨🚨🚨 [LAYOUT_DRAG_START_DATA] Active data:`, event.active.data.current);
    console.log(`🚨🚨🚨 [LAYOUT_DRAG_START_EVENT] Full event:`, {
      activeId: event.active.id,
      activeData: event.active.data.current,
      activatorEvent: event.activatorEvent
    });
    console.log(`🚨🚨🚨 [LAYOUT_DRAG_START_SUCCESS] Drag detection is working at layout level`);
    handleDragStart(event);
  };

  const enhancedHandleDragEnd = (event: DragEndEvent) => {
    console.log(`🚨🚨🚨 [LAYOUT_DRAG_END_DETECTED] ===== DRAG END DETECTED =====`);
    console.log(`🚨🚨🚨 [LAYOUT_DRAG_END_ACTIVE] Active ID: ${event.active.id}`);
    console.log(`🚨🚨🚨 [LAYOUT_DRAG_END_OVER] Over ID: ${event.over?.id || 'NULL'}`);
    console.log(`🚨🚨🚨 [LAYOUT_DRAG_END_OVER_DATA] Over data:`, event.over?.data?.current);
    
    if (!event.over) {
      console.log(`🚨🚨🚨 [LAYOUT_DRAG_END_NO_TARGET] No drop target detected`);
      return;
    }
    
    handleDragEnd(event);
  };

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

  console.log(`🚨🚨🚨 [LAYOUT_RENDER] ===== RENDERING LAYOUT =====`);
  console.log(`🚨🚨🚨 [LAYOUT_AVAILABLE] Available Pokemon: ${filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [LAYOUT_RANKINGS] Display Rankings: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [LAYOUT_DRAGGED] Active Dragged Pokemon: ${activeDraggedPokemon?.name || 'None'}`);

  return (
    <DndContext 
      onDragStart={enhancedHandleDragStart} 
      onDragEnd={enhancedHandleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-1">
        {/* Battle Controls Header */}
        <div className="max-w-7xl mx-auto mb-4">
          <BattleControls
            selectedGeneration={selectedGeneration}
            battleType={battleType}
            onGenerationChange={(gen) => onGenerationChange(Number(gen))}
            onBattleTypeChange={setBattleType}
            onRestartBattles={handleComprehensiveReset}
          />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-2" style={{ height: 'calc(100vh - 8rem)' }}>
            {/* Left side - Available Pokemon */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
              <AvailablePokemonSection
                availablePokemon={filteredAvailablePokemon}
                isLoading={isLoading}
                selectedGeneration={selectedGeneration}
                loadingType={loadingType}
                currentPage={currentPage}
                totalPages={totalPages}
                loadingRef={loadingRef}
                handlePageChange={handlePageChange}
                getPageRange={getPageRange}
              />
            </div>
            
            {/* Right side - Rankings */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
              <RankingsSection 
                displayRankings={displayRankings}
                pendingRefinements={new Set()}
                availablePokemon={filteredAvailablePokemon}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDraggedPokemon ? (
          <div className="opacity-90 transform scale-105 shadow-2xl z-50">
            <PokemonCard 
              pokemon={activeDraggedPokemon}
              viewMode="grid"
              compact={true}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
