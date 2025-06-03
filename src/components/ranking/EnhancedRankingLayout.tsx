
import React, { useMemo } from "react";
import { DndContext, DragOverlay, pointerWithin, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
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
  console.log(`🎨 [ENHANCED_LAYOUT_STABLE] handleDragEnd function exists: ${!!handleDragEnd}`);
  console.log(`🎨 [ENHANCED_LAYOUT_STABLE] handleManualReorder function exists: ${!!handleManualReorder}`);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    handleManualReorder,
    handleLocalReorder
  );

  // FIXED: Simple drag end handler that properly handles both available->rankings and rankings reordering
  const enhancedDragEnd = (event: DragEndEvent) => {
    console.log(`🔥🔥🔥 [LAYOUT_DRAG_FIX] ===== ENHANCED DRAG END =====`);
    console.log(`🔥🔥🔥 [LAYOUT_DRAG_FIX] Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    const { active, over } = event;
    if (!over) {
      console.log(`🔥🔥🔥 [LAYOUT_DRAG_FIX] No drop target`);
      return;
    }

    // First call the original handleDragEnd for available->rankings drops
    if (handleDragEnd) {
      console.log(`🔥🔥🔥 [LAYOUT_DRAG_FIX] Calling original handleDragEnd for state management`);
      handleDragEnd(event);
    }
    
    // Handle reordering within rankings using SortableContext logic
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // Only handle reordering if both items are in the rankings (not available Pokemon)
    if (!activeId.startsWith('available-') && !overId.startsWith('available-')) {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      const oldIndex = displayRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = displayRankings.findIndex(p => p.id === overPokemonId);
      
      console.log(`🔥🔥🔥 [LAYOUT_DRAG_FIX] Reorder attempt: Pokemon ${activePokemonId} from index ${oldIndex} to ${newIndex}`);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🔥🔥🔥 [LAYOUT_DRAG_FIX] Valid reorder - calling handleManualReorder`);
        handleManualReorder(activePokemonId, oldIndex, newIndex);
      } else {
        console.log(`🔥🔥🔥 [LAYOUT_DRAG_FIX] Invalid reorder indices - skipping`);
      }
    } else {
      console.log(`🔥🔥🔥 [LAYOUT_DRAG_FIX] Not a rankings reorder - letting original handler manage`);
    }
  };

  // Create sortable items from rankings
  const sortableItems = useMemo(() => {
    const items = displayRankings.map(p => p.id.toString());
    console.log(`🔥🔥🔥 [LAYOUT_SORTABLE] Creating ${items.length} sortable items:`, items.slice(0, 5));
    return items;
  }, [displayRankings]);

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={enhancedDragEnd}
    >
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
