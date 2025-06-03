
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
  const hookId = Date.now();
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

  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>(finalRankings);
  
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

  // Refs for current state access
  const localRankingsRef = useRef<RankedPokemon[]>(localRankings);
  const finalRankingsRef = useRef<RankedPokemon[]>(finalRankings);
  const onRankingsUpdateRef = useRef(onRankingsUpdate);
  
  useEffect(() => {
    localRankingsRef.current = localRankings;
  }, [localRankings]);
  
  useEffect(() => {
    finalRankingsRef.current = finalRankings;
  }, [finalRankings]);
  
  useEffect(() => {
    onRankingsUpdateRef.current = onRankingsUpdate;
  }, [onRankingsUpdate]);

  // CRITICAL DEBUG: Log state changes
  useEffect(() => {
    console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] localRankings changed:`, localRankings.slice(0, 3).map(p => p.name));
  }, [localRankings, hookId]);

  // Update local rankings when final rankings change (but not during drag)
  useEffect(() => {
    if (!isDragging && !isUpdating) {
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] Updating local rankings from props`);
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] FROM:`, localRankings.slice(0, 3).map(p => p.name));
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] TO:`, finalRankings.slice(0, 3).map(p => p.name));
      setLocalRankings(finalRankings);
    } else {
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] Skipping props update - dragging:${isDragging}, updating:${isUpdating}`);
    }
  }, [finalRankings, isDragging, isUpdating, hookId]);

  const getCurrentRankings = useCallback((): RankedPokemon[] => {
    const current = localRankingsRef.current;
    const fallback = finalRankingsRef.current;
    
    if (current.length === 0 && fallback.length > 0) {
      console.log('⚠️ [MANUAL_REORDER_CORE] Using fallback rankings');
      return fallback;
    }
    
    return current;
  }, []);

  const processReorder = useCallback((
    currentRankings: RankedPokemon[],
    oldIndex: number,
    newIndex: number,
    movedPokemon: RankedPokemon
  ) => {
    const processId = Date.now();
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ===== PROCESSING REORDER =====`);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Pokemon: ${movedPokemon.name} from ${oldIndex + 1} to ${newIndex + 1}`);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Current rankings BEFORE:`, currentRankings.slice(0, 3).map(p => p.name));
    
    // Create new rankings with manual order
    const newRankings = arrayMove(currentRankings, oldIndex, newIndex);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] New manual order:`, newRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name}`));
    
    // Simulate battles
    const battlesSimulated = simulateBattlesForReorder(newRankings, movedPokemon, oldIndex, newIndex);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Battles simulated:`, battlesSimulated);
    
    // Update scores while preserving order
    const updatedRankings = updateScoresPreservingOrder(newRankings, movedPokemon.id);
    
    // Verify order preservation
    const orderPreserved = newRankings.every((pokemon, index) => updatedRankings[index].id === pokemon.id);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Order preserved:`, orderPreserved);
    
    if (!orderPreserved) {
      console.error(`❌ [MANUAL_REORDER_CORE_${processId}] Order was not preserved!`);
    }
    
    // CRITICAL DEBUG: Update local state immediately with detailed logging
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ===== UPDATING LOCAL STATE =====`);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] BEFORE setLocalRankings:`, localRankingsRef.current.slice(0, 3).map(p => p.name));
    setLocalRankings(updatedRankings);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ✅ Called setLocalRankings with:`, updatedRankings.slice(0, 3).map(p => p.name));
    
    // CRITICAL DEBUG: Check state after a brief delay
    setTimeout(() => {
      console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ===== POST-UPDATE CHECK =====`);
      console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] localRankingsRef.current AFTER:`, localRankingsRef.current.slice(0, 3).map(p => p.name));
    }, 50);
    
    // Then call parent callback
    try {
      console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Calling parent callback...`);
      onRankingsUpdateRef.current(updatedRankings);
      console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ✅ Parent callback completed`);
    } catch (error) {
      console.error(`❌ [MANUAL_REORDER_CORE_${processId}] Parent callback failed:`, error);
    }
  }, [simulateBattlesForReorder, updateScoresPreservingOrder]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const dragId = Date.now();
    console.log(`🎯 [MANUAL_REORDER_CORE_${dragId}] ===== DRAG END HANDLER =====`);
    
    const currentRankings = getCurrentRankings();
    const { active, over } = event;
    
    clearDragState();
    
    if (!over || active.id === over.id) {
      console.log(`🎯 [MANUAL_REORDER_CORE_${dragId}] Drag ended with no change`);
      return;
    }

    const oldIndex = currentRankings.findIndex(p => p.id.toString() === active.id);
    const newIndex = currentRankings.findIndex(p => p.id.toString() === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.error(`❌ [MANUAL_REORDER_CORE_${dragId}] Could not find Pokemon indices`);
      return;
    }
    
    const movedPokemon = currentRankings[oldIndex];
    processReorder(currentRankings, oldIndex, newIndex, movedPokemon);
  }, [getCurrentRankings, clearDragState, processReorder]);

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const enhancedId = Date.now();
    console.log(`🎯 [MANUAL_REORDER_CORE_${enhancedId}] ===== ENHANCED MANUAL REORDER =====`);
    console.log(`🎯 [MANUAL_REORDER_CORE_${enhancedId}] Pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    
    const currentRankings = getCurrentRankings();
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
  }, [getCurrentRankings, processReorder]);

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
