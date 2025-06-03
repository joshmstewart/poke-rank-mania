
import React, { useMemo } from "react";
import { DndContext, DragOverlay, pointerWithin, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
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
  console.log(`🔥🔥🔥 [LAYOUT_FIXED] ===== ENHANCED LAYOUT RENDER =====`);
  console.log(`🔥🔥🔥 [LAYOUT_FIXED] displayRankings count: ${displayRankings.length}`);
  console.log(`🔥🔥🔥 [LAYOUT_FIXED] handleManualReorder exists: ${!!handleManualReorder}`);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    handleManualReorder,
    handleLocalReorder
  );

  // CRITICAL FIX: Completely revamped drag end handler
  const enhancedDragEnd = (event: DragEndEvent) => {
    console.log(`🔥🔥🔥 [LAYOUT_FIXED] ===== DRAG END STARTED =====`);
    
    const { active, over } = event;
    if (!over) {
      console.log(`🔥🔥🔥 [LAYOUT_FIXED] No drop target - ending`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    console.log(`🔥🔥🔥 [LAYOUT_FIXED] Drag: ${activeId} -> ${overId}`);

    // First, call the original drag end handler for state management
    if (handleDragEnd) {
      console.log(`🔥🔥🔥 [LAYOUT_FIXED] Calling original handleDragEnd`);
      handleDragEnd(event);
    }
    
    // CRITICAL FIX: Handle reordering within rankings
    const activeIndex = displayRankings.findIndex(p => p.id.toString() === activeId);
    const overIndex = displayRankings.findIndex(p => p.id.toString() === overId);
    
    console.log(`🔥🔥🔥 [LAYOUT_FIXED] Indices: active=${activeIndex}, over=${overIndex}`);
    
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const activePokemonId = Number(activeId);
      console.log(`🔥🔥🔥 [LAYOUT_FIXED] ✅ VALID REORDER - calling handleManualReorder`);
      console.log(`🔥🔥🔥 [LAYOUT_FIXED] Args: pokemonId=${activePokemonId}, from=${activeIndex}, to=${overIndex}`);
      
      if (handleManualReorder) {
        try {
          handleManualReorder(activePokemonId, activeIndex, overIndex);
          console.log(`🔥🔥🔥 [LAYOUT_FIXED] ✅ Manual reorder completed successfully`);
        } catch (error) {
          console.error(`🔥🔥🔥 [LAYOUT_FIXED] ❌ Manual reorder failed:`, error);
        }
      } else {
        console.error(`🔥🔥🔥 [LAYOUT_FIXED] ❌ handleManualReorder not available`);
      }
    } else {
      console.log(`🔥🔥🔥 [LAYOUT_FIXED] ❌ Invalid reorder - skipping`);
      console.log(`🔥🔥🔥 [LAYOUT_FIXED] Reasons: activeIndex=${activeIndex}, overIndex=${overIndex}, same=${activeIndex === overIndex}`);
    }
    
    console.log(`🔥🔥🔥 [LAYOUT_FIXED] ===== DRAG END COMPLETED =====`);
  };

  // Create sortable items for the main DndContext
  const allSortableItems = useMemo(() => {
    const rankingIds = displayRankings.map(p => p.id.toString());
    const availableIds = enhancedAvailablePokemon.map(p => `available-${p.id}`);
    const combined = [...availableIds, ...rankingIds];
    console.log(`🔥🔥🔥 [LAYOUT_FIXED] All sortable items: ${combined.length} (${availableIds.length} available + ${rankingIds.length} ranked)`);
    return combined;
  }, [displayRankings, enhancedAvailablePokemon]);

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
              onDragStart={handleDragStart}
              onDragEnd={enhancedDragEnd}
            >
              <SortableContext 
                items={allSortableItems}
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
