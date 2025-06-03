import React, { useMemo, useState, useEffect } from "react";
import { DndContext, DragOverlay, pointerWithin, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { Rating } from 'ts-trueskill';
import { useTrueSkillStore } from "@/stores/trueskillStore";
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

// Manual Score Adjustment Logic:
// Explicitly sets Pokémon's TrueSkill rating to the average of immediate neighbors upon manual reorder.
// Permanently maintains explicit positions even after refresh.
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

  // Manual ranking order state for visual persistence
  const [manualRankingOrder, setManualRankingOrder] = useState(displayRankings);
  const { updateRating, getRating } = useTrueSkillStore();
  
  // Update manual order when displayRankings changes
  useEffect(() => {
    setManualRankingOrder(displayRankings);
  }, [displayRankings]);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    handleManualReorder,
    handleLocalReorder
  );

  // Enhanced drag handlers with manual order preservation and permanent score adjustment
  const enhancedHandleDragStart = (event: DragStartEvent) => {
    console.log(`🔧 [MANUAL_DRAG] Manual Drag Start - ID: ${event.active.id}`);
    const activeId = event.active.id.toString();
    console.log(`🔧 [MANUAL_DRAG] Active ID as string: ${activeId}`);
    handleDragStart(event);
  };

  const enhancedHandleDragEnd = (event: DragEndEvent) => {
    console.log(`🔧 [MANUAL_DRAG] Manual Drag End - Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      console.log(`🔧 [MANUAL_DRAG] No drop target or same position - exiting`);
      return;
    }
    
    // Handle manual reordering within rankings
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // Only handle reordering within the rankings (not adding new Pokemon)
    if (!activeId.startsWith('available-') && !overId.startsWith('available-')) {
      const oldIndex = manualRankingOrder.findIndex(p => p.id.toString() === activeId);
      const newIndex = manualRankingOrder.findIndex(p => p.id.toString() === overId);
      
      console.log(`🔧 [MANUAL_DRAG] Reordering indices: ${oldIndex} -> ${newIndex}`);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Update manual order state for visual persistence
        const updatedManualOrder = [...manualRankingOrder];
        const [movedPokemon] = updatedManualOrder.splice(oldIndex, 1);
        updatedManualOrder.splice(newIndex, 0, movedPokemon);
        
        console.log(`🔧 [MANUAL_DRAG] ✅ Manual order updated: ${movedPokemon.name} moved to position ${newIndex}`);
        setManualRankingOrder(updatedManualOrder);

        // Manual Score Adjustment Logic:
        // Explicitly sets Pokémon's TrueSkill rating to the average of immediate neighbors upon manual reorder.
        console.log(`🎯 [SCORE_ADJUSTMENT] Starting permanent score adjustment for ${movedPokemon.name}`);
        
        const neighborAbove = updatedManualOrder[newIndex - 1];
        const neighborBelow = updatedManualOrder[newIndex + 1];
        
        let newMu, newSigma;
        
        // Get current ratings for neighbors
        const aboveRating = neighborAbove ? getRating(neighborAbove.id.toString()) : null;
        const belowRating = neighborBelow ? getRating(neighborBelow.id.toString()) : null;
        
        if (aboveRating && belowRating) {
          // Position between two neighbors - use average
          newMu = (aboveRating.mu + belowRating.mu) / 2;
          newSigma = (aboveRating.sigma + belowRating.sigma) / 2;
          console.log(`🎯 [SCORE_ADJUSTMENT] Between neighbors - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
        } else if (aboveRating) {
          // Top position - slightly higher than neighbor above
          newMu = aboveRating.mu + 0.001;
          newSigma = aboveRating.sigma;
          console.log(`🎯 [SCORE_ADJUSTMENT] Top position - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
        } else if (belowRating) {
          // Bottom position - slightly lower than neighbor below
          newMu = belowRating.mu - 0.001;
          newSigma = belowRating.sigma;
          console.log(`🎯 [SCORE_ADJUSTMENT] Bottom position - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
        } else {
          // Edge case: only Pokémon in list - keep current rating
          const currentRating = getRating(movedPokemon.id.toString());
          newMu = currentRating.mu;
          newSigma = currentRating.sigma;
          console.log(`🎯 [SCORE_ADJUSTMENT] Only Pokemon - keeping current rating`);
        }
        
        // Special handling for identical neighbors
        if (aboveRating && belowRating && 
            Math.abs(aboveRating.mu - belowRating.mu) < 0.001 && 
            Math.abs(aboveRating.sigma - belowRating.sigma) < 0.001) {
          newMu += 0.001;       // Slightly differentiate mu
          newSigma = Math.max(newSigma - 0.001, 1.0);    // Slightly reduce sigma but keep minimum
          console.log(`🎯 [SCORE_ADJUSTMENT] Identical neighbors - differentiated to mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
        }
        
        // Permanently update the Pokémon's rating explicitly
        const newRating = new Rating(newMu, newSigma);
        updateRating(movedPokemon.id.toString(), newRating);
        console.log(`🎯 [SCORE_ADJUSTMENT] ✅ Permanently updated ${movedPokemon.name} rating in TrueSkill store`);
        
        // Trigger background manual reorder without TrueSkill updates (those are now handled above)
        handleManualReorder(parseInt(activeId), oldIndex, newIndex);
        
        return;
      }
    }
    
    // For other drag operations (like adding Pokemon), use original handler
    handleDragEnd(event);
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
            {/* SINGLE DNDCONTEXT: Handles ALL drag-and-drop operations */}
            <DndContext
              collisionDetection={pointerWithin}
              onDragStart={enhancedHandleDragStart}
              onDragEnd={enhancedHandleDragEnd}
            >
              <RankingsSectionStable
                displayRankings={manualRankingOrder}
                onManualReorder={stableOnManualReorder}
                onLocalReorder={stableOnLocalReorder}
                pendingRefinements={new Set()}
                availablePokemon={enhancedAvailablePokemon}
              />
              
              {/* Drag overlay for visual feedback */}
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
