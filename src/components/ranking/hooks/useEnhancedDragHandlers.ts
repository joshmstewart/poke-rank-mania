
import { useState } from 'react';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { Rating } from 'ts-trueskill';
import { ScoreDebugInfo } from '../types/debugTypes';
import { 
  findIdenticalNeighborsAbove,
  findIdenticalNeighborsBelow,
  applyCascadingAdjustmentsAbove,
  applyCascadingAdjustmentsBelow
} from '../utils/cascadingAdjustments';
import { refreshRankingsWithUpdatedScores } from '../utils/scoreRefresh';

interface UseEnhancedDragHandlersProps {
  manualRankingOrder: any[];
  setManualRankingOrder: (rankings: any[]) => void;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  updateRating: (id: string, rating: Rating) => void;
  getRating: (id: string) => Rating;
  setDebugData: (data: ScoreDebugInfo[]) => void;
}

export const useEnhancedDragHandlers = ({
  manualRankingOrder,
  setManualRankingOrder,
  handleDragStart,
  handleDragEnd,
  handleManualReorder,
  updateRating,
  getRating,
  setDebugData
}: UseEnhancedDragHandlersProps) => {
  
  const enhancedHandleDragStart = (event: DragStartEvent) => {
    console.log(`🔧 [MANUAL_DRAG] Manual Drag Start - ID: ${event.active.id}`);
    const activeId = event.active.id.toString();
    console.log(`🔧 [MANUAL_DRAG] Active ID as string: ${activeId}`);
    
    if (activeId.startsWith('available-')) {
      console.log(`🔧 [MANUAL_DRAG] Dragging from Available grid: ${activeId}`);
    } else if (activeId.startsWith('ranking-')) {
      console.log(`🔧 [MANUAL_DRAG] Dragging within Rankings grid: ${activeId}`);
    } else {
      console.log(`🔧 [MANUAL_DRAG] Legacy ID format detected: ${activeId}`);
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
    
    // Handle manual reordering within rankings (both legacy and new format)
    const isRankingReorder = (
      (activeId.startsWith('ranking-') || !activeId.startsWith('available-')) &&
      (overId.startsWith('ranking-') || (!overId.startsWith('available-') && !isNaN(parseInt(overId))))
    );
    
    if (isRankingReorder) {
      // Extract pokemon IDs (handle both ranking- prefix and legacy numeric IDs)
      const activePokemonId = activeId.startsWith('ranking-') ? 
        parseInt(activeId.replace('ranking-', '')) : 
        parseInt(activeId);
      const overPokemonId = overId.startsWith('ranking-') ? 
        parseInt(overId.replace('ranking-', '')) : 
        parseInt(overId);
      
      const oldIndex = manualRankingOrder.findIndex(p => p.id === activePokemonId);
      const newIndex = manualRankingOrder.findIndex(p => p.id === overPokemonId);
      
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
          
          // Check if cascading adjustment is needed
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
        const refreshedRankings = refreshRankingsWithUpdatedScores(updatedManualOrder, getRating);
        setManualRankingOrder(refreshedRankings);
        
        console.log(`🔄 [UI_REFRESH] ✅ UI refreshed with ${refreshedRankings.length} updated rankings`);
        
        // Trigger background manual reorder for external state sync
        handleManualReorder(activePokemonId, oldIndex, newIndex);
        
        return;
      }
    }
    
    // For other drag operations, use original handler
    handleDragEnd(event);
  };

  return {
    enhancedHandleDragStart,
    enhancedHandleDragEnd
  };
};
