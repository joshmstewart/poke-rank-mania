
import React, { useMemo } from "react";
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  console.log(`🎨 [ENHANCED_LAYOUT_STABLE] Rendering with ${displayRankings.length} rankings`);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    handleManualReorder,
    handleLocalReorder
  );

  // Memoize sortable items
  const sortableItems = useMemo(() => 
    displayRankings.map(p => p.id.toString()),
    [displayRankings]
  );

  // Memoized controls section
  const controlsSection = useMemo(() => (
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
  ), [selectedGeneration, battleType, onGenerationChange, setBattleType, handleComprehensiveReset]);

  // Memoized drag overlay
  const dragOverlay = useMemo(() => (
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
  ), [activeDraggedPokemon]);

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-gray-100 min-h-screen p-4">
        {controlsSection}

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
              <SortableContext 
                items={sortableItems}
                strategy={verticalListSortingStrategy}
              >
                <RankingsSectionStable
                  displayRankings={displayRankings}
                  onManualReorder={stableOnManualReorder}
                  onLocalReorder={stableOnLocalReorder}
                  pendingRefinements={new Set()}
                  availablePokemon={enhancedAvailablePokemon}
                />
              </SortableContext>
            </Card>
          </div>
        </div>

        {dragOverlay}
      </div>
    </DndContext>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.displayRankings.length === nextProps.displayRankings.length &&
    prevProps.enhancedAvailablePokemon.length === nextProps.enhancedAvailablePokemon.length &&
    prevProps.selectedGeneration === nextProps.selectedGeneration &&
    prevProps.battleType === nextProps.battleType &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.isLoading === nextProps.isLoading
  );
});

EnhancedRankingLayout.displayName = 'EnhancedRankingLayout';
