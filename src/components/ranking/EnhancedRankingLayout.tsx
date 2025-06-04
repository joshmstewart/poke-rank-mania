
import React, { useMemo, useState, useEffect } from "react";
import { DndContext, DragOverlay, closestCorners, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
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
  position: string; // e.g., 'Dragged', 'Above 1', 'Below 1', etc.
  muBefore: number;
  sigmaBefore: number;
  scoreBefore: number;
  muAfter?: number;
  sigmaAfter?: number;
  scoreAfter?: number;
  adjusted?: boolean; // explicitly indicates if adjusted by cascading logic
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

  // Helper function to refresh rankings with updated TrueSkill scores
  const refreshRankingsWithUpdatedScores = (rankings: any[]) => {
    const updatedRankings = rankings.map(pokemon => {
      const rating = getRating(pokemon.id.toString());
      const newScore = rating.mu - rating.sigma;
      
      return {
        ...pokemon,
        score: newScore,
        rating: rating,
        mu: rating.mu,
        sigma: rating.sigma
      };
    });
    
    console.log(`🔄 [SCORE_REFRESH] Updated scores for ${updatedRankings.length} Pokemon`);
    return updatedRankings;
  };

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

  // Enhanced drag handlers with detailed debug information capture
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
    console.log(`🔧 [ENHANCED_DEBUG_DRAG] Manual Drag End with Detailed Debug - Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      console.log(`🔧 [ENHANCED_DEBUG_DRAG] No drop target or same position - exiting`);
      return;
    }
    
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // Handle dragging from Available to Rankings
    if (activeId.startsWith('available-')) {
      console.log(`🔧 [ENHANCED_DEBUG_DRAG] Available Pokemon dragged to Rankings`);
      handleDragEnd(event);
      return;
    }
    
    // Handle manual reordering within rankings with detailed debug capture and immediate UI refresh
    if (!activeId.startsWith('available-') && !overId.startsWith('available-')) {
      const oldIndex = manualRankingOrder.findIndex(p => p.id.toString() === activeId);
      const newIndex = manualRankingOrder.findIndex(p => p.id.toString() === overId);
      
      console.log(`🔧 [ENHANCED_DEBUG_DRAG] Reordering indices: ${oldIndex} -> ${newIndex}`);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Update manual order state for visual persistence
        const updatedManualOrder = [...manualRankingOrder];
        const [movedPokemon] = updatedManualOrder.splice(oldIndex, 1);
        updatedManualOrder.splice(newIndex, 0, movedPokemon);
        
        console.log(`🔧 [ENHANCED_DEBUG_DRAG] ✅ Manual order updated: ${movedPokemon.name} moved to position ${newIndex + 1}`);

        // Initialize debug data collection
        const debugInfo: ScoreDebugInfo[] = [];

        // Capture Dragged Pokémon before adjustment
        const draggedRatingBefore = getRating(movedPokemon.id.toString());
        debugInfo.push({
          name: movedPokemon.name,
          position: 'Dragged',
          muBefore: draggedRatingBefore.mu,
          sigmaBefore: draggedRatingBefore.sigma,
          scoreBefore: draggedRatingBefore.mu - draggedRatingBefore.sigma,
        });

        // Capture top 3 neighbors above
        for (let i = 1; i <= 3; i++) {
          const neighborAbove = updatedManualOrder[newIndex - i];
          if (!neighborAbove) break;

          const neighborRatingBefore = getRating(neighborAbove.id.toString());
          debugInfo.push({
            name: neighborAbove.name,
            position: `Above ${i}`,
            muBefore: neighborRatingBefore.mu,
            sigmaBefore: neighborRatingBefore.sigma,
            scoreBefore: neighborRatingBefore.mu - neighborRatingBefore.sigma,
          });
        }

        // Capture top 3 neighbors below
        for (let i = 1; i <= 3; i++) {
          const neighborBelow = updatedManualOrder[newIndex + i];
          if (!neighborBelow) break;

          const neighborRatingBefore = getRating(neighborBelow.id.toString());
          debugInfo.push({
            name: neighborBelow.name,
            position: `Below ${i}`,
            muBefore: neighborRatingBefore.mu,
            sigmaBefore: neighborRatingBefore.sigma,
            scoreBefore: neighborRatingBefore.mu - neighborRatingBefore.sigma,
          });
        }

        console.log(`🎯 [ENHANCED_DEBUG_SCORING] Starting explicit position-based adjustment for ${movedPokemon.name} at position ${newIndex + 1}`);
        
        // Get immediate neighbors
        const immediateNeighborAbove = newIndex > 0 ? updatedManualOrder[newIndex - 1] : null;
        const immediateNeighborBelow = newIndex < updatedManualOrder.length - 1 ? updatedManualOrder[newIndex + 1] : null;
        
        let newMu: number, newSigma: number;
        const beforeMovedRating = getRating(movedPokemon.id.toString());
        
        if (immediateNeighborAbove && immediateNeighborBelow) {
          const scoreAbove = getRating(immediateNeighborAbove.id.toString()).mu - getRating(immediateNeighborAbove.id.toString()).sigma;
          const scoreBelow = getRating(immediateNeighborBelow.id.toString()).mu - getRating(immediateNeighborBelow.id.toString()).sigma;
          
          console.log(`🎯 [ENHANCED_DEBUG_SCORING] Immediate neighbors - Above: ${scoreAbove.toFixed(5)}, Below: ${scoreBelow.toFixed(5)}`);
          
          // Check if cascading adjustment is needed (both immediate neighbors have identical scores)
          const needsCascading = Math.abs(scoreAbove - scoreBelow) < 0.000001;
          
          if (needsCascading) {
            console.log(`🔧 [ENHANCED_DEBUG_CASCADING] Identical immediate neighbors detected - applying cascading adjustments`);
            
            // Find and adjust identical neighbors above
            let cascadeIndex = newIndex - 1;
            const identicalNeighborsAbove = [];
            
            // Find all identical neighbors above
            while (cascadeIndex >= 0) {
              const neighbor = updatedManualOrder[cascadeIndex];
              const neighborScore = getRating(neighbor.id.toString()).mu - getRating(neighbor.id.toString()).sigma;
              
              if (Math.abs(neighborScore - scoreAbove) < 0.000001) {
                identicalNeighborsAbove.unshift(neighbor);
                cascadeIndex--;
              } else {
                break;
              }
            }
            
            // Find top distinct score for cascading
            const topDistinctScore = cascadeIndex >= 0 ? 
              getRating(updatedManualOrder[cascadeIndex].id.toString()).mu - getRating(updatedManualOrder[cascadeIndex].id.toString()).sigma :
              scoreAbove + 1.0;
            
            // Apply cascading adjustments above
            let currentScore = topDistinctScore;
            identicalNeighborsAbove.forEach((neighbor) => {
              const originalRating = getRating(neighbor.id.toString());
              const adjustedSigma = originalRating.sigma * 0.9999;
              const adjustedScore = currentScore - 0.00001;
              const adjustedMu = adjustedScore + adjustedSigma;
              
              console.log(`🔧 [ENHANCED_DEBUG_CASCADING] ${neighbor.name}: ${originalRating.mu - originalRating.sigma} → ${adjustedScore}`);
              
              updateRating(neighbor.id.toString(), new Rating(adjustedMu, adjustedSigma));
              
              // Update debug info
              const debugEntry = debugInfo.find(d => d.name === neighbor.name);
              if (debugEntry) {
                debugEntry.muAfter = adjustedMu;
                debugEntry.sigmaAfter = adjustedSigma;
                debugEntry.scoreAfter = adjustedScore;
                debugEntry.adjusted = true;
              }
              
              currentScore = adjustedScore;
            });
            
            // Find and adjust identical neighbors below
            cascadeIndex = newIndex + 1;
            const identicalNeighborsBelow = [];
            
            // Find all identical neighbors below
            while (cascadeIndex < updatedManualOrder.length) {
              const neighbor = updatedManualOrder[cascadeIndex];
              const neighborScore = getRating(neighbor.id.toString()).mu - getRating(neighbor.id.toString()).sigma;
              
              if (Math.abs(neighborScore - scoreBelow) < 0.000001) {
                identicalNeighborsBelow.push(neighbor);
                cascadeIndex++;
              } else {
                break;
              }
            }
            
            // Find bottom distinct score for cascading
            const bottomDistinctScore = cascadeIndex < updatedManualOrder.length ? 
              getRating(updatedManualOrder[cascadeIndex].id.toString()).mu - getRating(updatedManualOrder[cascadeIndex].id.toString()).sigma :
              scoreBelow - 1.0;
            
            // Apply cascading adjustments below
            currentScore = bottomDistinctScore;
            identicalNeighborsBelow.reverse().forEach((neighbor) => {
              const originalRating = getRating(neighbor.id.toString());
              const adjustedSigma = originalRating.sigma * 0.9999;
              const adjustedScore = currentScore + 0.00001;
              const adjustedMu = adjustedScore + adjustedSigma;
              
              console.log(`🔧 [ENHANCED_DEBUG_CASCADING] ${neighbor.name}: ${originalRating.mu - originalRating.sigma} → ${adjustedScore}`);
              
              updateRating(neighbor.id.toString(), new Rating(adjustedMu, adjustedSigma));
              
              // Update debug info
              const debugEntry = debugInfo.find(d => d.name === neighbor.name);
              if (debugEntry) {
                debugEntry.muAfter = adjustedMu;
                debugEntry.sigmaAfter = adjustedSigma;
                debugEntry.scoreAfter = adjustedScore;
                debugEntry.adjusted = true;
              }
              
              currentScore = adjustedScore;
            });
            
            // Get final scores after cascading
            const finalScoreAbove = getRating(immediateNeighborAbove.id.toString()).mu - getRating(immediateNeighborAbove.id.toString()).sigma;
            const finalScoreBelow = getRating(immediateNeighborBelow.id.toString()).mu - getRating(immediateNeighborBelow.id.toString()).sigma;
            
            // Position exactly between adjusted neighbors
            const targetScore = (finalScoreAbove + finalScoreBelow) / 2;
            newSigma = beforeMovedRating.sigma;
            newMu = targetScore + newSigma;
            
            console.log(`🎯 [ENHANCED_DEBUG_SCORING] After cascading - positioned between ${finalScoreAbove.toFixed(5)} and ${finalScoreBelow.toFixed(5)}, target: ${targetScore.toFixed(5)}`);
          } else {
            console.log(`🔧 [ENHANCED_DEBUG_CASCADING] No cascading needed - immediate neighbors have distinct scores`);
            
            // Direct positioning between distinct neighbors
            const targetScore = (scoreAbove + scoreBelow) / 2;
            newSigma = beforeMovedRating.sigma;
            newMu = targetScore + newSigma;
            console.log(`🎯 [ENHANCED_DEBUG_SCORING] Positioned between ${scoreAbove.toFixed(5)} and ${scoreBelow.toFixed(5)}, target: ${targetScore.toFixed(5)}`);
          }
        } else if (immediateNeighborAbove) {
          // Top position
          const scoreAbove = getRating(immediateNeighborAbove.id.toString()).mu - getRating(immediateNeighborAbove.id.toString()).sigma;
          newSigma = beforeMovedRating.sigma;
          newMu = scoreAbove + 0.001 + newSigma;
          console.log(`🎯 [ENHANCED_DEBUG_SCORING] Top position above ${scoreAbove.toFixed(5)}`);
        } else if (immediateNeighborBelow) {
          // Bottom position
          const scoreBelow = getRating(immediateNeighborBelow.id.toString()).mu - getRating(immediateNeighborBelow.id.toString()).sigma;
          newSigma = beforeMovedRating.sigma;
          newMu = scoreBelow - 0.001 + newSigma;
          console.log(`🎯 [ENHANCED_DEBUG_SCORING] Bottom position below ${scoreBelow.toFixed(5)}`);
        } else {
          // Only Pokemon
          newMu = beforeMovedRating.mu;
          newSigma = beforeMovedRating.sigma;
          console.log(`🎯 [ENHANCED_DEBUG_SCORING] Only Pokemon - keeping current rating`);
        }
        
        // Update dragged Pokemon's rating
        const newRating = new Rating(newMu, newSigma);
        updateRating(movedPokemon.id.toString(), newRating);
        
        // Update debug info for dragged Pokemon
        const draggedDebugEntry = debugInfo.find(d => d.position === 'Dragged');
        if (draggedDebugEntry) {
          draggedDebugEntry.muAfter = newMu;
          draggedDebugEntry.sigmaAfter = newSigma;
          draggedDebugEntry.scoreAfter = newMu - newSigma;
        }
        
        // Update debug data state
        setDebugData(debugInfo);
        
        console.log(`🎯 [ENHANCED_DEBUG_SCORING] ✅ Updated ${movedPokemon.name} rating with detailed debug capture`);
        
        // CRITICAL: Immediately refresh the UI with updated scores
        console.log(`🔄 [UI_REFRESH] Refreshing UI with updated TrueSkill scores`);
        const refreshedRankings = refreshRankingsWithUpdatedScores(updatedManualOrder);
        setManualRankingOrder(refreshedRankings);
        
        console.log(`🔄 [UI_REFRESH] ✅ UI refreshed with ${refreshedRankings.length} updated rankings`);
        
        // Trigger background manual reorder for external state sync
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
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={enhancedHandleDragStart}
          onDragEnd={enhancedHandleDragEnd}
        >
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
              <RankingsSectionStable
                displayRankings={manualRankingOrder}
                onManualReorder={stableOnManualReorder}
                onLocalReorder={stableOnLocalReorder}
                pendingRefinements={new Set()}
                availablePokemon={enhancedAvailablePokemon}
              />
            </Card>
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
        </DndContext>
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
