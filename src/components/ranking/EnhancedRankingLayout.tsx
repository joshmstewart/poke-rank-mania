
import React from "react";
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import { RankingsSection } from "./RankingsSection";
import EnhancedAvailablePokemonSection from "./EnhancedAvailablePokemonSection";
import UnifiedControls from "@/components/shared/UnifiedControls";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import { Card } from "@/components/ui/card";

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
  dragSourceInfo: {fromAvailable: boolean, isRanked: boolean} | null;
  sourceCardProps: any;
  filteredAvailablePokemon: any[];
  sensors: any;
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

export const EnhancedRankingLayout: React.FC<EnhancedRankingLayoutProps> = ({
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
  dragSourceInfo,
  sourceCardProps,
  filteredAvailablePokemon,
  sensors,
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
  console.log('%cEnhancedRankingLayout rendering', 'color: blue', { displayRankings });

  const handleManualModeReset = () => {
    handleComprehensiveReset();
  };

  const debugHandleDragStart = (event: any) => {
    console.log(`[DND_DEBUG] ===== DragStart Event =====`);
    console.log(`[DND_DEBUG] Event:`, event);
    console.log(`[DND_DEBUG] Active:`, event.active);
    console.log(`[DND_DEBUG] Active ID:`, event.active?.id);
    console.log(`[DND_DEBUG] Active Data:`, event.active?.data?.current);
    console.log(`[DND_DEBUG] Activator Event:`, event.activatorEvent);
    console.log(`[DND_DEBUG] ===== Calling handleDragStart =====`);
    
    handleDragStart(event);
  };

  const debugHandleDragEnd = (event: any) => {
    console.log(`[DND_DEBUG] ===== DragEnd Event =====`);
    console.log(`[DND_DEBUG] Event:`, event);
    console.log(`[DND_DEBUG] Active:`, event.active);
    console.log(`[DND_DEBUG] Over:`, event.over);
    console.log(`[DND_DEBUG] Collisions:`, event.collisions);
    console.log(`[DND_DEBUG] All collision IDs:`, event.collisions?.map(c => c.id) || 'none');
    console.log(`[DND_DEBUG] Delta:`, event.delta);
    console.log(`[DND_DEBUG] Active Rect:`, event.active?.rect);
    console.log(`[DND_DEBUG] Over Rect:`, event.over?.rect);
    console.log(`[DND_DEBUG] ===== Calling handleDragEnd =====`);
    
    handleDragEnd(event);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={debugHandleDragStart}
      onDragEnd={debugHandleDragEnd}
    >
      <div className="bg-gray-100 min-h-screen p-4">
        {/* Settings Section */}
        <div className="max-w-7xl mx-auto mb-4">
          <UnifiedControls
            selectedGeneration={selectedGeneration}
            battleType={battleType}
            onGenerationChange={(gen) => onGenerationChange(Number(gen))}
            onBattleTypeChange={setBattleType}
            showBattleTypeControls={true}
            mode="manual"
            onReset={handleComprehensiveReset}
            customResetAction={handleManualModeReset}
          />
        </div>

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4" style={{ height: 'calc(200vh - 12rem)' }}>
            {/* Enhanced Available Pokemon Card */}
            <Card className="shadow-lg border border-gray-200 flex flex-col">
              <EnhancedAvailablePokemonSection
                availablePokemon={enhancedAvailablePokemon}
                rankedPokemon={displayRankings}
              />
            </Card>

            {/* Rankings Card */}
            <Card className="shadow-lg border border-gray-200 flex flex-col">
              <RankingsSection
                displayRankings={displayRankings}
                pendingRefinements={new Set()}
                availablePokemon={enhancedAvailablePokemon}
              />
            </Card>
          </div>
        </div>

        {/* Drag Overlay - Enhanced with fallback */}
        <DragOverlay>
          {activeDraggedPokemon ? (
            <div className="transform rotate-2 scale-105 opacity-95 z-50">
              {sourceCardProps ? (
                <DraggablePokemonMilestoneCard
                  {...sourceCardProps}
                  isDraggable={false}
                />
              ) : (
                <DraggablePokemonMilestoneCard
                  pokemon={activeDraggedPokemon}
                  index={0}
                  isPending={false}
                  showRank={false}
                  isDraggable={false}
                  isAvailable={dragSourceInfo?.fromAvailable || false}
                  context={dragSourceInfo?.fromAvailable ? 'available' : 'ranked'}
                  allRankedPokemon={displayRankings}
                />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
