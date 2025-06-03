
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { RankedPokemon } from '@/services/pokemon';
import { useBattleSimulation } from './useBattleSimulation';
import { useScoreUpdater } from './useScoreUpdater';
import { useDragState } from './useDragState';
import { useRenderTracker } from './useRenderTracker';

export const useManualReorderCore = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (newRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean,
  addImpliedBattle?: (winnerId: number, loserId: number) => void
) => {
  const hookId = useRef(Date.now()).current; // Stable ID
  console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] Initializing with ${finalRankings.length} rankings`);

  // Early bailout for large datasets
  if (finalRankings.length > 500) {
    console.error('❌ Dataset too large for manual reorder. Please reduce the number of items.');
    return {
      displayRankings: finalRankings,
      handleDragStart: () => {},
      handleDragEnd: () => {},
      handleEnhancedManualReorder: () => {},
      isDragging: false,
      isUpdating: false
    };
  }

  useRenderTracker('useManualReorderCore', { 
    rankingsCount: finalRankings.length,
    preventAutoResorting 
  });

  // CRITICAL FIX: Use stable local state that doesn't cause render loops
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>(() => {
    console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] Initial local rankings:`, finalRankings.slice(0, 3).map(p => p.name));
    return finalRankings;
  });
  
  const {
    isDragging,
    draggedPokemonId,
    isUpdating,
    handleDragStart,
    clearDragState,
    setUpdatingState
  } = useDragState();

  const { simulateBattlesForReorder } = useBattleSimulation(addImpliedBattle);
  const { updateScoresPreservingOrder } = useScoreUpdater(preventAutoResorting);

  // CRITICAL FIX: Only update local rankings when not dragging and when there's a meaningful change
  const lastFinalRankingsRef = useRef<RankedPokemon[]>(finalRankings);
  useEffect(() => {
    // Skip updates during drag operations or when updating
    if (isDragging || isUpdating) {
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] Skipping props update - dragging:${isDragging}, updating:${isUpdating}`);
      return;
    }

    // Only update if there's a significant change (length or first few items)
    const hasSignificantChange = 
      finalRankings.length !== lastFinalRankingsRef.current.length ||
      finalRankings.slice(0, 5).some((p, i) => p.id !== lastFinalRankingsRef.current[i]?.id);

    if (hasSignificantChange) {
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] Significant change detected, updating local rankings`);
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] FROM:`, localRankings.slice(0, 3).map(p => p.name));
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] TO:`, finalRankings.slice(0, 3).map(p => p.name));
      
      setLocalRankings(finalRankings);
      lastFinalRankingsRef.current = finalRankings;
    }
  }, [finalRankings, isDragging, isUpdating, hookId]); // Removed localRankings from deps to prevent loops

  const processReorder = useCallback((
    currentRankings: RankedPokemon[],
    oldIndex: number,
    newIndex: number,
    movedPokemon: RankedPokemon
  ) => {
    const processId = Date.now();
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ===== PROCESSING REORDER =====`);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Pokemon: ${movedPokemon.name} from ${oldIndex + 1} to ${newIndex + 1}`);
    
    // Create new rankings with manual order
    const newRankings = arrayMove(currentRankings, oldIndex, newIndex);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] New manual order:`, newRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name}`));
    
    // Simulate battles
    const battlesSimulated = simulateBattlesForReorder(newRankings, movedPokemon, oldIndex, newIndex);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Battles simulated:`, battlesSimulated);
    
    // Update scores while preserving order
    const updatedRankings = updateScoresPreservingOrder(newRankings, movedPokemon.id);
    
    // CRITICAL FIX: Update local state immediately and prevent render loops
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ===== IMMEDIATE LOCAL UPDATE =====`);
    setLocalRankings(updatedRankings);
    
    // Update the ref to prevent the useEffect from overriding our change
    lastFinalRankingsRef.current = updatedRankings;
    
    // Then call parent callback
    try {
      console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Calling parent callback...`);
      onRankingsUpdate(updatedRankings);
      console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ✅ Parent callback completed`);
    } catch (error) {
      console.error(`❌ [MANUAL_REORDER_CORE_${processId}] Parent callback failed:`, error);
    }
  }, [simulateBattlesForReorder, updateScoresPreservingOrder, onRankingsUpdate]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const dragId = Date.now();
    console.log(`🎯 [MANUAL_REORDER_CORE_${dragId}] ===== DRAG END HANDLER =====`);
    
    const { active, over } = event;
    
    clearDragState();
    
    if (!over || active.id === over.id) {
      console.log(`🎯 [MANUAL_REORDER_CORE_${dragId}] Drag ended with no change`);
      return;
    }

    // Use current local rankings for drag operations
    const currentRankings = localRankings;
    const oldIndex = currentRankings.findIndex(p => p.id.toString() === active.id);
    const newIndex = currentRankings.findIndex(p => p.id.toString() === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.error(`❌ [MANUAL_REORDER_CORE_${dragId}] Could not find Pokemon indices`);
      return;
    }
    
    const movedPokemon = currentRankings[oldIndex];
    processReorder(currentRankings, oldIndex, newIndex, movedPokemon);
  }, [localRankings, clearDragState, processReorder]);

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const enhancedId = Date.now();
    console.log(`🎯 [MANUAL_REORDER_CORE_${enhancedId}] ===== ENHANCED MANUAL REORDER =====`);
    console.log(`🎯 [MANUAL_REORDER_CORE_${enhancedId}] Pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    
    // Use current local rankings
    const currentRankings = localRankings;
    console.log(`🎯 [MANUAL_REORDER_CORE_${enhancedId}] Current rankings:`, currentRankings.slice(0, 3).map(p => p.name));
    
    if (currentRankings.length === 0) {
      console.error(`❌ [MANUAL_REORDER_CORE_${enhancedId}] Current rankings is empty!`);
      return;
    }
    
    if (sourceIndex < 0 || sourceIndex >= currentRankings.length) {
      console.error(`❌ [MANUAL_REORDER_CORE_${enhancedId}] Invalid source index:`, sourceIndex);
      return;
    }
    
    const movedPokemon = currentRankings[sourceIndex];
    if (!movedPokemon) {
      console.error(`❌ [MANUAL_REORDER_CORE_${enhancedId}] Pokemon not found at source index`);
      return;
    }
    
    processReorder(currentRankings, sourceIndex, destinationIndex, movedPokemon);
  }, [localRankings, processReorder]);

  // CRITICAL FIX: Stable memoization that doesn't cause render loops
  const displayRankings = useMemo(() => {
    const result = localRankings.map((pokemon) => ({
      ...pokemon,
      isBeingDragged: draggedPokemonId === pokemon.id
    }));
    console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] displayRankings memoized:`, result.slice(0, 3).map(p => p.name));
    return result;
  }, [localRankings, draggedPokemonId, hookId]);

  return {
    displayRankings,
    handleDragStart,
    handleDragEnd,
    handleEnhancedManualReorder,
    isDragging,
    isUpdating
  };
};
