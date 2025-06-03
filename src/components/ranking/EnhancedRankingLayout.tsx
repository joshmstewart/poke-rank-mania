
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
import { Button } from "@/components/ui/button";
import { useStableDragHandlers } from "@/hooks/battle/useStableDragHandlers";
import ScoreAdjustmentDebugModal from "./ScoreAdjustmentDebugModal";

interface ScoreDebugInfo {
  name: string;
  position: string;
  muBefore: number;
  sigmaBefore: number;
  scoreBefore: number;
  muAfter?: number;
  sigmaAfter?: number;
  scoreAfter?: number;
}

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

// Explicitly updated manual score adjustment logic:
// Uses nearest distinct neighbors (above/below) to compute new μ/σ.
// Ensures stable sorting, especially with multiple identical-scored Pokémon.
const findNearestDistinct = (
  list: any[],
  startIndex: number,
  direction: number,
  getRating: (id: string) => Rating
) => {
  if (startIndex < 0 || startIndex >= list.length) return null;
  
  const baseRating = getRating(list[startIndex].id.toString());
  const baseMu = baseRating.mu;
  const baseSigma = baseRating.sigma;

  let index = startIndex + direction;
  while (index >= 0 && index < list.length) {
    const neighbor = list[index];
    const neighborRating = getRating(neighbor.id.toString());
    if (neighborRating.mu !== baseMu || neighborRating.sigma !== baseSigma) {
      return neighborRating;
    }
    index += direction;
  }
  return null;
};

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
  
  // Debug modal state
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState<ScoreDebugInfo[]>([]);
  
  // Update manual order when displayRankings changes
  useEffect(() => {
    setManualRankingOrder(displayRankings);
  }, [displayRankings]);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    handleManualReorder,
    handleLocalReorder
  );

  // Enhanced drag handlers with explicit nearest-distinct-neighbor logic
  const enhancedHandleDragStart = (event: DragStartEvent) => {
    console.log(`🔧 [MANUAL_DRAG] Manual Drag Start - ID: ${event.active.id}`);
    const activeId = event.active.id.toString();
    console.log(`🔧 [MANUAL_DRAG] Active ID as string: ${activeId}`);
    
    // EXPLICIT NOTE: "All Filtered" Pokémon cards intentionally use 'available-{id}' format
    // Ranked Pokemon use just '{id}' format for reordering
    if (activeId.startsWith('available-')) {
      console.log(`🔧 [MANUAL_DRAG] Dragging from Available grid: ${activeId}`);
    } else {
      console.log(`🔧 [MANUAL_DRAG] Dragging within Rankings grid: ${activeId}`);
    }
    
    handleDragStart(event);
  };

  const enhancedHandleDragEnd = (event: DragEndEvent) => {
    console.log(`🔧 [MANUAL_DRAG] Manual Drag End - Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      console.log(`🔧 [MANUAL_DRAG] No drop target or same position - exiting`);
      return;
    }
    
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // CORRECTED: Handle dragging from Available to Rankings
    if (activeId.startsWith('available-')) {
      console.log(`🔧 [MANUAL_DRAG] Available Pokemon dragged to Rankings`);
      // Let the original handler manage this cross-grid drag
      handleDragEnd(event);
      return;
    }
    
    // Handle manual reordering within rankings (ranked Pokemon only)
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

        // Explicitly updated manual score adjustment logic:
        // Uses nearest distinct neighbors (above/below) to compute new μ/σ.
        // Ensures stable sorting, especially with multiple identical-scored Pokémon.
        console.log(`🎯 [SCORE_ADJUSTMENT] Starting explicit nearest-distinct-neighbor adjustment for ${movedPokemon.name}`);
        
        // Capture BEFORE adjustment data
        const beforeMovedRating = getRating(movedPokemon.id.toString());
        
        // Explicit nearest distinct neighbor search:
        const neighborAbove = findNearestDistinct(updatedManualOrder, newIndex, -1, getRating);
        const neighborBelow = findNearestDistinct(updatedManualOrder, newIndex, 1, getRating);
        
        let newMu: number, newSigma: number;
        
        if (neighborAbove && neighborBelow) {
          // Explicit average of distinctly scored neighbors
          newMu = (neighborAbove.mu + neighborBelow.mu) / 2;
          newSigma = (neighborAbove.sigma + neighborBelow.sigma) / 2;
          
          const newScore = newMu - newSigma;
          const aboveScore = neighborAbove.mu - neighborAbove.sigma;
          const belowScore = neighborBelow.mu - neighborBelow.sigma;
          
          // Explicit checks ensuring correct score ordering:
          if (newScore >= aboveScore) newMu -= 0.001;
          if (newScore <= belowScore) newMu += 0.001;
          
          console.log(`🎯 [SCORE_ADJUSTMENT] Between distinct neighbors - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
        } else if (neighborAbove) {
          // Only neighbor above explicitly found
          newMu = neighborAbove.mu - 0.001;
          newSigma = neighborAbove.sigma;
          console.log(`🎯 [SCORE_ADJUSTMENT] Above distinct neighbor only - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
        } else if (neighborBelow) {
          // Only neighbor below explicitly found
          newMu = neighborBelow.mu + 0.001;
          newSigma = neighborBelow.sigma;
          console.log(`🎯 [SCORE_ADJUSTMENT] Below distinct neighbor only - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
        } else {
          // Explicit edge case handling (no distinct neighbors)
          newMu = beforeMovedRating.mu;
          newSigma = Math.max(beforeMovedRating.sigma - 0.001, 1.0);
          console.log(`🎯 [SCORE_ADJUSTMENT] No distinct neighbors - keeping current rating with slight sigma adjustment`);
        }
        
        // Explicit permanent TrueSkill update:
        const newRating = new Rating(newMu, newSigma);
        updateRating(movedPokemon.id.toString(), newRating);
        console.log(`🎯 [SCORE_ADJUSTMENT] ✅ Permanently updated ${movedPokemon.name} rating in TrueSkill store`);
        
        // Set debug data explicitly
        const debugInfo: ScoreDebugInfo[] = [
          {
            name: movedPokemon.name,
            position: 'Moved',
            muBefore: beforeMovedRating.mu,
            sigmaBefore: beforeMovedRating.sigma,
            scoreBefore: beforeMovedRating.mu - beforeMovedRating.sigma,
            muAfter: newMu,
            sigmaAfter: newSigma,
            scoreAfter: newMu - newSigma
          }
        ];

        if (neighborAbove) {
          debugInfo.push({
            name: `Above Neighbor`,
            position: 'Above',
            muBefore: neighborAbove.mu,
            sigmaBefore: neighborAbove.sigma,
            scoreBefore: neighborAbove.mu - neighborAbove.sigma,
          });
        }

        if (neighborBelow) {
          debugInfo.push({
            name: `Below Neighbor`,
            position: 'Below',
            muBefore: neighborBelow.mu,
            sigmaBefore: neighborBelow.sigma,
            scoreBefore: neighborBelow.mu - neighborBelow.sigma,
          });
        }

        setDebugData(debugInfo);
        
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
        
        {/* Debug Controls */}
        <div className="flex justify-center mt-4">
          <Button 
            onClick={() => setShowDebugModal(true)}
            variant="outline"
            className="bg-purple-100 border-purple-400 text-purple-800 hover:bg-purple-200"
          >
            🔍 Debug Score Adjustment
          </Button>
        </div>
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
      
      {/* Debug Modal */}
      <ScoreAdjustmentDebugModal
        open={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        debugData={debugData}
      />
    </div>
  );
});

EnhancedRankingLayout.displayName = 'EnhancedRankingLayout';
