
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

  // Enhanced drag handlers with explicit position-based score calculation
  const enhancedHandleDragStart = (event: DragStartEvent) => {
    console.log(`🔧 [MANUAL_DRAG] Manual Drag Start - ID: ${event.active.id}`);
    const activeId = event.active.id.toString();
    console.log(`🔧 [MANUAL_DRAG] Active ID as string: ${activeId}`);
    
    if (activeId.startsWith('available-')) {
      console.log(`🔧 [MANUAL_DRAG] Dragging from Available grid: ${activeId}`);
    } else {
      console.log(`🔧 [MANUAL_DRAG] Dragging within Rankings grid: ${activeId}`);
    }
    
    handleDragStart(event);
  };

  // Drag-and-Drop Explicit Manual Score Adjustment:
  // Ensures moved Pokémon stays exactly in the dropped position upon refresh.
  // Explicitly handles identical neighbor scores with a tiny μ adjustment.
  const enhancedHandleDragEnd = (event: DragEndEvent) => {
    console.log(`🔧 [MANUAL_DRAG] Manual Drag End - Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      console.log(`🔧 [MANUAL_DRAG] No drop target or same position - exiting`);
      return;
    }
    
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // Handle dragging from Available to Rankings
    if (activeId.startsWith('available-')) {
      console.log(`🔧 [MANUAL_DRAG] Available Pokemon dragged to Rankings`);
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
        
        console.log(`🔧 [MANUAL_DRAG] ✅ Manual order updated: ${movedPokemon.name} moved to position ${newIndex + 1}`);
        setManualRankingOrder(updatedManualOrder);

        console.log(`🎯 [POSITION_BASED_SCORING] Starting explicit position-based score adjustment for ${movedPokemon.name}`);
        
        // Capture BEFORE adjustment data
        const beforeMovedRating = getRating(movedPokemon.id.toString());
        
        // Explicitly retrieve immediate neighbors
        const neighborAbove = newIndex > 0 ? updatedManualOrder[newIndex - 1] : null;
        const neighborBelow = newIndex < updatedManualOrder.length - 1 ? updatedManualOrder[newIndex + 1] : null;
        
        let newMu: number, newSigma: number;
        
        if (neighborAbove && neighborBelow) {
          // Get neighbor ratings from TrueSkill store
          const aboveRating = getRating(neighborAbove.id.toString());
          const belowRating = getRating(neighborBelow.id.toString());
          
          // Clearly defined variables:
          const scoreAbove = aboveRating.mu - aboveRating.sigma;
          const scoreBelow = belowRating.mu - belowRating.sigma;
          
          // Calculate explicit target score:
          const targetScore = (scoreAbove + scoreBelow) / 2;
          
          console.log(`🎯 [POSITION_BASED_SCORING] Above score: ${scoreAbove.toFixed(3)}, Below score: ${scoreBelow.toFixed(3)}, Target: ${targetScore.toFixed(3)}`);
          
          // Handle Special Case – Identical Neighbor Scores
          if (
            scoreAbove === scoreBelow &&
            aboveRating.mu === belowRating.mu &&
            aboveRating.sigma === belowRating.sigma
          ) {
            console.log(`🎯 [POSITION_BASED_SCORING] Identical neighbors detected - applying tiny adjustment`);
            
            const tinyAdjustment = 0.001;
            
            if (newIndex < oldIndex) { // moving upwards
              newMu = aboveRating.mu + tinyAdjustment;
            } else { // moving downwards
              newMu = belowRating.mu - tinyAdjustment;
            }
            
            newSigma = aboveRating.sigma; // keep sigma explicitly unchanged
            
            console.log(`🎯 [POSITION_BASED_SCORING] Identical case - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
          } else {
            // General case: Adjust μ Precisely to Achieve Target Score
            newSigma = (aboveRating.sigma + belowRating.sigma) / 2;
            newMu = targetScore + newSigma; // Ensures exactly: newMu - newSigma = targetScore
            
            console.log(`🎯 [POSITION_BASED_SCORING] General case - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}, resulting score: ${(newMu - newSigma).toFixed(3)}`);
          }
        } else if (neighborAbove) {
          // Explicit top position handling
          const aboveRating = getRating(neighborAbove.id.toString());
          newSigma = aboveRating.sigma;
          newMu = aboveRating.mu + 0.001;
          console.log(`🎯 [POSITION_BASED_SCORING] Top position - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
        } else if (neighborBelow) {
          // Explicit bottom position handling
          const belowRating = getRating(neighborBelow.id.toString());
          newSigma = belowRating.sigma;
          newMu = belowRating.mu - 0.001;
          console.log(`🎯 [POSITION_BASED_SCORING] Bottom position - mu: ${newMu.toFixed(3)}, sigma: ${newSigma.toFixed(3)}`);
        } else {
          // Only Pokémon in list
          newMu = beforeMovedRating.mu;
          newSigma = beforeMovedRating.sigma;
          console.log(`🎯 [POSITION_BASED_SCORING] Only Pokemon - keeping current rating`);
        }
        
        // Permanent TrueSkill Store Update
        const newRating = new Rating(newMu, newSigma);
        updateRating(movedPokemon.id.toString(), newRating);
        console.log(`🎯 [POSITION_BASED_SCORING] ✅ Permanently updated ${movedPokemon.name} rating in TrueSkill store`);
        
        // Set debug data for modal
        const debugInfo: ScoreDebugInfo[] = [
          {
            name: movedPokemon.name,
            position: `Position ${newIndex + 1}`,
            muBefore: beforeMovedRating.mu,
            sigmaBefore: beforeMovedRating.sigma,
            scoreBefore: beforeMovedRating.mu - beforeMovedRating.sigma,
            muAfter: newMu,
            sigmaAfter: newSigma,
            scoreAfter: newMu - newSigma
          }
        ];

        if (neighborAbove) {
          const aboveRating = getRating(neighborAbove.id.toString());
          debugInfo.push({
            name: neighborAbove.name,
            position: `Above (Position ${newIndex})`,
            muBefore: aboveRating.mu,
            sigmaBefore: aboveRating.sigma,
            scoreBefore: aboveRating.mu - aboveRating.sigma,
          });
        }

        if (neighborBelow) {
          const belowRating = getRating(neighborBelow.id.toString());
          debugInfo.push({
            name: neighborBelow.name,
            position: `Below (Position ${newIndex + 2})`,
            muBefore: belowRating.mu,
            sigmaBefore: belowRating.sigma,
            scoreBefore: belowRating.mu - belowRating.sigma,
          });
        }

        setDebugData(debugInfo);
        
        // Trigger background manual reorder
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
      
      <ScoreAdjustmentDebugModal
        open={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        debugData={debugData}
      />
    </div>
  );
});

EnhancedRankingLayout.displayName = 'EnhancedRankingLayout';
