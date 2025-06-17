
import React from "react";
import { DndContext, DragOverlay, closestCenter, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { BattleType } from "@/hooks/battle/types";
import { LoadingType } from "@/hooks/pokemon/types";
import { RankingsSection } from "./RankingsSection";
import EnhancedAvailablePokemonSection from "./EnhancedAvailablePokemonSection";
import UnifiedControls from "@/components/shared/UnifiedControls";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";

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
  console.log('%cEnhancedRankingLayout rendering with PURE DnD', 'color: green', { displayRankings });

  const handleManualModeReset = () => {
    handleComprehensiveReset();
  };

  // PURE DND: Simplified collision detection focused on drop zones
  const customCollisionDetection = (args: any) => {
    const { active, droppableContainers } = args;
    
    console.log(`[PURE_COLLISION] Active: ${active.id}, Available containers:`, 
      Array.from(droppableContainers.keys())
    );

    // First try pointer-based detection for precise positioning
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      console.log(`[PURE_COLLISION] Pointer collision found:`, pointerCollisions);
      return pointerCollisions;
    }

    // Fallback to rectangle intersection
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      console.log(`[PURE_COLLISION] Rectangle collision found:`, rectCollisions);
      return rectCollisions;
    }

    // Final fallback to closest center
    const centerCollisions = closestCenter(args);
    console.log(`[PURE_COLLISION] Using closest center:`, centerCollisions);
    return centerCollisions;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
            {/* Enhanced Available Pokemon */}
            <div className="shadow-lg border border-gray-200 rounded-lg bg-white flex flex-col">
              <EnhancedAvailablePokemonSection
                availablePokemon={enhancedAvailablePokemon}
                rankedPokemon={displayRankings}
              />
            </div>

            {/* Rankings */}
            <div className="shadow-lg border border-gray-200 rounded-lg bg-white flex flex-col">
              <RankingsSection
                displayRankings={displayRankings}
                pendingRefinements={new Set()}
                availablePokemon={enhancedAvailablePokemon}
                onManualReorder={handleManualReorder}
                onLocalReorder={handleLocalReorder}
              />
            </div>
          </div>
        </div>

        {/* PURE DND: Enhanced Drag Overlay */}
        <DragOverlay 
          dropAnimation={null}
          style={{ zIndex: 99999 }}
        >
          {activeDraggedPokemon ? (
            <div 
              className="transform rotate-2 scale-105 opacity-95" 
              style={{ 
                zIndex: 99999,
                position: 'fixed',
                pointerEvents: 'none',
              }}
            >
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
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
