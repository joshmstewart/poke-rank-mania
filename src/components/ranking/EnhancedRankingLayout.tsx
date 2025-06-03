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

  // CASCADING ADJUSTMENT HELPER FUNCTIONS
  const findIdenticalNeighborsAbove = (rankings: any[], startIndex: number, getRating: (id: string) => Rating) => {
    const identicalNeighbors: any[] = [];
    if (startIndex <= 0) return identicalNeighbors;
    
    const startScore = getRating(rankings[startIndex].id.toString()).mu - getRating(rankings[startIndex].id.toString()).sigma;
    
    // Go upward from startIndex to find all identical scores
    for (let i = startIndex - 1; i >= 0; i--) {
      const currentScore = getRating(rankings[i].id.toString()).mu - getRating(rankings[i].id.toString()).sigma;
      if (Math.abs(currentScore - startScore) < 0.000001) { // identical within tolerance
        identicalNeighbors.unshift(rankings[i]); // add to beginning
      } else {
        break; // stop when we find a different score
      }
    }
    
    return identicalNeighbors;
  };

  const findIdenticalNeighborsBelow = (rankings: any[], startIndex: number, getRating: (id: string) => Rating) => {
    const identicalNeighbors: any[] = [];
    if (startIndex >= rankings.length - 1) return identicalNeighbors;
    
    const startScore = getRating(rankings[startIndex].id.toString()).mu - getRating(rankings[startIndex].id.toString()).sigma;
    
    // Go downward from startIndex to find all identical scores
    for (let i = startIndex + 1; i < rankings.length; i++) {
      const currentScore = getRating(rankings[i].id.toString()).mu - getRating(rankings[i].id.toString()).sigma;
      if (Math.abs(currentScore - startScore) < 0.000001) { // identical within tolerance
        identicalNeighbors.push(rankings[i]);
      } else {
        break; // stop when we find a different score
      }
    }
    
    return identicalNeighbors;
  };

  const applyCascadingAdjustmentsAbove = (identicalNeighbors: any[], topDistinctScore: number, updateRating: (id: string, rating: Rating) => void) => {
    console.log(`🔧 [CASCADING] Applying cascading adjustments above for ${identicalNeighbors.length} neighbors`);
    
    let currentScore = topDistinctScore;
    
    // Cascade downward from topmost to bottommost
    identicalNeighbors.forEach((neighbor, index) => {
      const originalRating = getRating(neighbor.id.toString());
      const adjustedSigma = originalRating.sigma * 0.9999;
      const adjustedScore = currentScore - 0.00001; // slightly below the Pokemon above
      const adjustedMu = adjustedScore + adjustedSigma;
      
      console.log(`🔧 [CASCADING] ${neighbor.name} (${index + 1}/${identicalNeighbors.length}): ${originalRating.mu - originalRating.sigma} → ${adjustedScore}`);
      
      updateRating(neighbor.id.toString(), new Rating(adjustedMu, adjustedSigma));
      currentScore = adjustedScore; // update for next iteration
    });
  };

  const applyCascadingAdjustmentsBelow = (identicalNeighbors: any[], bottomDistinctScore: number, updateRating: (id: string, rating: Rating) => void) => {
    console.log(`🔧 [CASCADING] Applying cascading adjustments below for ${identicalNeighbors.length} neighbors`);
    
    let currentScore = bottomDistinctScore;
    
    // Cascade upward from bottommost to topmost
    identicalNeighbors.reverse().forEach((neighbor, index) => {
      const originalRating = getRating(neighbor.id.toString());
      const adjustedSigma = originalRating.sigma * 0.9999;
      const adjustedScore = currentScore + 0.00001; // slightly above the Pokemon below
      const adjustedMu = adjustedScore + adjustedSigma;
      
      console.log(`🔧 [CASCADING] ${neighbor.name} (${index + 1}/${identicalNeighbors.length}): ${originalRating.mu - originalRating.sigma} → ${adjustedScore}`);
      
      updateRating(neighbor.id.toString(), new Rating(adjustedMu, adjustedSigma));
      currentScore = adjustedScore; // update for next iteration
    });
  };

  // Enhanced drag handlers with cascading logic
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

  const enhancedHandleDragEnd = (event: DragEndEvent) => {
    console.log(`🔧 [CASCADING_DRAG] Manual Drag End with Cascading Logic - Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      console.log(`🔧 [CASCADING_DRAG] No drop target or same position - exiting`);
      return;
    }
    
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // Handle dragging from Available to Rankings
    if (activeId.startsWith('available-')) {
      console.log(`🔧 [CASCADING_DRAG] Available Pokemon dragged to Rankings`);
      handleDragEnd(event);
      return;
    }
    
    // Handle manual reordering within rankings with cascading adjustments
    if (!activeId.startsWith('available-') && !overId.startsWith('available-')) {
      const oldIndex = manualRankingOrder.findIndex(p => p.id.toString() === activeId);
      const newIndex = manualRankingOrder.findIndex(p => p.id.toString() === overId);
      
      console.log(`🔧 [CASCADING_DRAG] Reordering indices: ${oldIndex} -> ${newIndex}`);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Update manual order state for visual persistence
        const updatedManualOrder = [...manualRankingOrder];
        const [movedPokemon] = updatedManualOrder.splice(oldIndex, 1);
        updatedManualOrder.splice(newIndex, 0, movedPokemon);
        
        console.log(`🔧 [CASCADING_DRAG] ✅ Manual order updated: ${movedPokemon.name} moved to position ${newIndex + 1}`);
        setManualRankingOrder(updatedManualOrder);

        console.log(`🎯 [CASCADING_SCORING] Starting cascading adjustment for ${movedPokemon.name} at position ${newIndex + 1}`);
        
        // Get immediate neighbors
        const immediateNeighborAbove = newIndex > 0 ? updatedManualOrder[newIndex - 1] : null;
        const immediateNeighborBelow = newIndex < updatedManualOrder.length - 1 ? updatedManualOrder[newIndex + 1] : null;
        
        let finalScoreAbove: number, finalScoreBelow: number;
        
        // Check if cascading is needed (both immediate neighbors have identical scores)
        const needsCascading = immediateNeighborAbove && immediateNeighborBelow &&
          Math.abs(
            (getRating(immediateNeighborAbove.id.toString()).mu - getRating(immediateNeighborAbove.id.toString()).sigma) -
            (getRating(immediateNeighborBelow.id.toString()).mu - getRating(immediateNeighborBelow.id.toString()).sigma)
          ) < 0.000001;
        
        if (needsCascading) {
          console.log(`🔧 [CASCADING] Identical immediate neighbors detected - applying cascading adjustments`);
          
          // Find all identical neighbors above
          const identicalNeighborsAbove = findIdenticalNeighborsAbove(updatedManualOrder, newIndex, getRating);
          const identicalNeighborsBelow = findIdenticalNeighborsBelow(updatedManualOrder, newIndex, getRating);
          
          console.log(`🔧 [CASCADING] Found ${identicalNeighborsAbove.length} identical neighbors above, ${identicalNeighborsBelow.length} below`);
          
          // Find distinct top and bottom scores for cascading
          const topDistinctIndex = newIndex - identicalNeighborsAbove.length - 1;
          const bottomDistinctIndex = newIndex + identicalNeighborsBelow.length + 1;
          
          const topDistinctScore = topDistinctIndex >= 0 ?
            getRating(updatedManualOrder[topDistinctIndex].id.toString()).mu - getRating(updatedManualOrder[topDistinctIndex].id.toString()).sigma :
            (getRating(immediateNeighborAbove.id.toString()).mu - getRating(immediateNeighborAbove.id.toString()).sigma) + 1.0;
            
          const bottomDistinctScore = bottomDistinctIndex < updatedManualOrder.length ?
            getRating(updatedManualOrder[bottomDistinctIndex].id.toString()).mu - getRating(updatedManualOrder[bottomDistinctIndex].id.toString()).sigma :
            (getRating(immediateNeighborBelow.id.toString()).mu - getRating(immediateNeighborBelow.id.toString()).sigma) - 1.0;
          
          // Apply cascading adjustments
          if (identicalNeighborsAbove.length > 0) {
            applyCascadingAdjustmentsAbove(identicalNeighborsAbove, topDistinctScore, updateRating);
          }
          
          if (identicalNeighborsBelow.length > 0) {
            applyCascadingAdjustmentsBelow(identicalNeighborsBelow, bottomDistinctScore, updateRating);
          }
          
          // Get final scores after cascading
          finalScoreAbove = getRating(immediateNeighborAbove.id.toString()).mu - getRating(immediateNeighborAbove.id.toString()).sigma;
          finalScoreBelow = getRating(immediateNeighborBelow.id.toString()).mu - getRating(immediateNeighborBelow.id.toString()).sigma;
          
        } else {
          console.log(`🔧 [CASCADING] No cascading needed - immediate neighbors have distinct scores`);
          
          // Use existing scores
          finalScoreAbove = immediateNeighborAbove ? 
            getRating(immediateNeighborAbove.id.toString()).mu - getRating(immediateNeighborAbove.id.toString()).sigma : null;
          finalScoreBelow = immediateNeighborBelow ? 
            getRating(immediateNeighborBelow.id.toString()).mu - getRating(immediateNeighborBelow.id.toString()).sigma : null;
        }
        
        // Calculate final score for dragged Pokemon
        let newMu: number, newSigma: number;
        const beforeMovedRating = getRating(movedPokemon.id.toString());
        
        if (finalScoreAbove !== null && finalScoreBelow !== null) {
          // Position exactly between adjusted neighbors
          const targetScore = (finalScoreAbove + finalScoreBelow) / 2;
          newSigma = beforeMovedRating.sigma; // keep original sigma
          newMu = targetScore + newSigma;
          console.log(`🎯 [CASCADING_SCORING] Positioned between ${finalScoreAbove.toFixed(5)} and ${finalScoreBelow.toFixed(5)}, target: ${targetScore.toFixed(5)}`);
        } else if (finalScoreAbove !== null) {
          // Top position
          newSigma = beforeMovedRating.sigma;
          newMu = finalScoreAbove + 0.001 + newSigma;
          console.log(`🎯 [CASCADING_SCORING] Top position above ${finalScoreAbove.toFixed(5)}`);
        } else if (finalScoreBelow !== null) {
          // Bottom position
          newSigma = beforeMovedRating.sigma;
          newMu = finalScoreBelow - 0.001 + newSigma;
          console.log(`🎯 [CASCADING_SCORING] Bottom position below ${finalScoreBelow.toFixed(5)}`);
        } else {
          // Only Pokemon
          newMu = beforeMovedRating.mu;
          newSigma = beforeMovedRating.sigma;
          console.log(`🎯 [CASCADING_SCORING] Only Pokemon - keeping current rating`);
        }
        
        // Update dragged Pokemon's rating
        const newRating = new Rating(newMu, newSigma);
        updateRating(movedPokemon.id.toString(), newRating);
        console.log(`🎯 [CASCADING_SCORING] ✅ Updated ${movedPokemon.name} rating with cascading logic`);
        
        // Trigger background manual reorder
        handleManualReorder(parseInt(activeId), oldIndex, newIndex);
        
        return;
      }
    }
    
    // For other drag operations, use original handler
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
