
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
  console.log('🎯 [MANUAL_REORDER_CORE] Initializing with', finalRankings.length, 'rankings');

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

  // Update local rankings when final rankings change (but not during drag)
  useEffect(() => {
    if (!isDragging && !isUpdating) {
      console.log('🎯 [MANUAL_REORDER_CORE] Updating local rankings from props');
      setLocalRankings(finalRankings);
    }
  }, [finalRankings, isDragging, isUpdating]);

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
    console.log('🎯 [MANUAL_REORDER_CORE] Processing reorder:', movedPokemon.name, 'from', oldIndex + 1, 'to', newIndex + 1);
    
    // Create new rankings with manual order
    const newRankings = arrayMove(currentRankings, oldIndex, newIndex);
    console.log('🎯 [MANUAL_REORDER_CORE] New manual order:', newRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name}`));
    
    // Simulate battles
    const battlesSimulated = simulateBattlesForReorder(newRankings, movedPokemon, oldIndex, newIndex);
    console.log('🎯 [MANUAL_REORDER_CORE] Battles simulated:', battlesSimulated);
    
    // Update scores while preserving order
    const updatedRankings = updateScoresPreservingOrder(newRankings, movedPokemon.id);
    
    // Verify order preservation
    const orderPreserved = newRankings.every((pokemon, index) => updatedRankings[index].id === pokemon.id);
    console.log('🎯 [MANUAL_REORDER_CORE] Order preserved:', orderPreserved);
    
    if (!orderPreserved) {
      console.error('❌ [MANUAL_REORDER_CORE] Order was not preserved!');
    }
    
    // CRITICAL FIX: Update local state immediately
    setLocalRankings(updatedRankings);
    console.log('🎯 [MANUAL_REORDER_CORE] ✅ Local state updated immediately');
    
    // Then call parent callback
    try {
      onRankingsUpdateRef.current(updatedRankings);
      console.log('🎯 [MANUAL_REORDER_CORE] ✅ Parent callback completed');
    } catch (error) {
      console.error('❌ [MANUAL_REORDER_CORE] Parent callback failed:', error);
    }
  }, [simulateBattlesForReorder, updateScoresPreservingOrder]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log('🎯 [MANUAL_REORDER_CORE] Drag end handler called');
    
    const currentRankings = getCurrentRankings();
    const { active, over } = event;
    
    clearDragState();
    
    if (!over || active.id === over.id) {
      console.log('🎯 [MANUAL_REORDER_CORE] Drag ended with no change');
      return;
    }

    const oldIndex = currentRankings.findIndex(p => p.id.toString() === active.id);
    const newIndex = currentRankings.findIndex(p => p.id.toString() === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.error('❌ [MANUAL_REORDER_CORE] Could not find Pokemon indices');
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
    console.log('🎯 [MANUAL_REORDER_CORE] Enhanced manual reorder called');
    
    const currentRankings = getCurrentRankings();
    
    if (currentRankings.length === 0) {
      console.error('❌ [MANUAL_REORDER_CORE] Current rankings is empty!');
      return;
    }
    
    if (sourceIndex < 0 || sourceIndex >= currentRankings.length) {
      console.error('❌ [MANUAL_REORDER_CORE] Invalid source index:', sourceIndex);
      return;
    }
    
    const movedPokemon = currentRankings[sourceIndex];
    if (!movedPokemon) {
      console.error('❌ [MANUAL_REORDER_CORE] Pokemon not found at source index');
      return;
    }
    
    processReorder(currentRankings, sourceIndex, destinationIndex, movedPokemon);
  }, [getCurrentRankings, processReorder]);

  const displayRankings = useMemo(() => {
    return localRankings.map((pokemon) => ({
      ...pokemon,
      isBeingDragged: draggedPokemonId === pokemon.id
    }));
  }, [localRankings, draggedPokemonId]);

  return {
    displayRankings,
    handleDragStart,
    handleDragEnd,
    handleEnhancedManualReorder,
    isDragging,
    isUpdating
  };
};
