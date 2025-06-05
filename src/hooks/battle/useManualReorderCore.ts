
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { RankedPokemon } from '@/services/pokemon';
import { useBattleSimulation } from './useBattleSimulation';
import { useScoreUpdater } from './useScoreUpdater';
import { useRenderTracker } from './useRenderTracker';

export const useManualReorderCore = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (newRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean,
  addImpliedBattle?: (winnerId: number, loserId: number) => void
) => {
  const hookId = useRef(Date.now()).current;
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

  // CRITICAL FIX: Use completely stable state management
  const stableRankingsRef = useRef<RankedPokemon[]>(finalRankings);
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>(() => {
    console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] Initial local rankings:`, finalRankings.slice(0, 3).map(p => p.name));
    stableRankingsRef.current = finalRankings;
    return finalRankings;
  });
  
  // CRITICAL FIX: Use refs for drag state to prevent React state corruption
  const isDraggingRef = useRef(false);
  const draggedPokemonIdRef = useRef<number | null>(null);
  const isUpdatingRef = useRef(false);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Stable callbacks with no dependencies
  const handleDragStart = useCallback((event: any) => {
    const draggedId = parseInt(event.active.id);
    isDraggingRef.current = true;
    draggedPokemonIdRef.current = draggedId;
    setRenderTrigger(prev => prev + 1);
    console.log('🎯 [DRAG_STATE] Drag started for Pokemon ID:', draggedId);
  }, []);

  const clearDragState = useCallback(() => {
    isDraggingRef.current = false;
    draggedPokemonIdRef.current = null;
    setRenderTrigger(prev => prev + 1);
  }, []);

  const setUpdatingState = useCallback((updating: boolean) => {
    isUpdatingRef.current = updating;
    setRenderTrigger(prev => prev + 1);
  }, []);

  // CRITICAL FIX: Create stable instances with empty deps
  const { simulateBattlesForReorder } = useBattleSimulation(addImpliedBattle);
  const { updateScoresPreservingOrder } = useScoreUpdater(preventAutoResorting);

  // CRITICAL FIX: Only update when there's a real change and not during drag
  useEffect(() => {
    if (isDraggingRef.current || isUpdatingRef.current) {
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] Skipping props update - dragging:${isDraggingRef.current}, updating:${isUpdatingRef.current}`);
      return;
    }

    // Check if there's a meaningful difference
    const hasChange = finalRankings.length !== stableRankingsRef.current.length ||
      finalRankings.slice(0, 5).some((p, i) => p.id !== stableRankingsRef.current[i]?.id);

    if (hasChange) {
      console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] Updating from props - length: ${finalRankings.length}`);
      stableRankingsRef.current = finalRankings;
      setLocalRankings(finalRankings);
    }
  }, [finalRankings, hookId]); // CRITICAL: Remove isDragging/isUpdating from deps

  const processReorder = useCallback((
    currentRankings: RankedPokemon[],
    oldIndex: number,
    newIndex: number,
    movedPokemon: RankedPokemon
  ) => {
    const processId = Date.now();
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ===== PROCESSING REORDER =====`);
    
    if (currentRankings.length === 0) {
      console.error(`❌ [MANUAL_REORDER_CORE_${processId}] Rankings array is empty! Using stable ref.`);
      currentRankings = stableRankingsRef.current;
      if (currentRankings.length === 0) {
        console.error(`❌ [MANUAL_REORDER_CORE_${processId}] Stable ref is also empty! Cannot proceed.`);
        return;
      }
      oldIndex = currentRankings.findIndex(p => p.id === movedPokemon.id);
      if (oldIndex === -1) {
        console.error(`❌ [MANUAL_REORDER_CORE_${processId}] Pokemon not found in stable ref either!`);
        return;
      }
    }
    
    // Create new rankings with manual order
    const newRankings = arrayMove(currentRankings, oldIndex, newIndex);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] New manual order:`, newRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name}`));
    
    // Simulate battles
    const battlesSimulated = simulateBattlesForReorder(newRankings, movedPokemon, oldIndex, newIndex);
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Battles simulated:`, battlesSimulated);
    
    // Update scores while preserving order
    const updatedRankings = updateScoresPreservingOrder(newRankings, movedPokemon.id);
    
    // Update both local state and stable ref immediately
    console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ===== UPDATING STATE =====`);
    stableRankingsRef.current = updatedRankings;
    setLocalRankings(updatedRankings);
    
    // Call parent callback
    setTimeout(() => {
      try {
        console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] Calling parent callback...`);
        onRankingsUpdate(updatedRankings);
        console.log(`🎯 [MANUAL_REORDER_CORE_${processId}] ✅ Parent callback completed`);
      } catch (error) {
        console.error(`❌ [MANUAL_REORDER_CORE_${processId}] Parent callback failed:`, error);
      }
    }, 0);
  }, []); // CRITICAL: Empty deps to prevent re-creation

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const dragId = Date.now();
    console.log(`🎯 [MANUAL_REORDER_CORE_${dragId}] ===== DRAG END HANDLER =====`);
    
    const { active, over } = event;
    
    clearDragState();
    
    if (!over || active.id === over.id) {
      console.log(`🎯 [MANUAL_REORDER_CORE_${dragId}] Drag ended with no change`);
      return;
    }

    // Use stable ref to ensure we have valid data
    const currentRankings = stableRankingsRef.current.length > 0 ? stableRankingsRef.current : localRankings;
    console.log(`🎯 [MANUAL_REORDER_CORE_${dragId}] Using rankings source with ${currentRankings.length} items`);
    
    const oldIndex = currentRankings.findIndex(p => p.id.toString() === active.id);
    const newIndex = currentRankings.findIndex(p => p.id.toString() === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.error(`❌ [MANUAL_REORDER_CORE_${dragId}] Could not find Pokemon indices - old: ${oldIndex}, new: ${newIndex}`);
      return;
    }
    
    const movedPokemon = currentRankings[oldIndex];
    console.log(`🎯 [MANUAL_REORDER_CORE_${dragId}] Moving ${movedPokemon.name} from ${oldIndex} to ${newIndex}`);
    
    processReorder(currentRankings, oldIndex, newIndex, movedPokemon);
  }, []); // CRITICAL: Empty deps

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const enhancedId = Date.now();
    console.log(`🎯 [MANUAL_REORDER_CORE_${enhancedId}] ===== ENHANCED MANUAL REORDER =====`);
    
    // Use stable ref first, fallback to local rankings
    const currentRankings = stableRankingsRef.current.length > 0 ? stableRankingsRef.current : localRankings;
    
    if (currentRankings.length === 0) {
      console.error(`❌ [MANUAL_REORDER_CORE_${enhancedId}] No valid rankings available!`);
      return;
    }
    
    if (sourceIndex < 0 || sourceIndex >= currentRankings.length) {
      console.error(`❌ [MANUAL_REORDER_CORE_${enhancedId}] Invalid source index: ${sourceIndex}`);
      return;
    }
    
    const movedPokemon = currentRankings[sourceIndex];
    if (!movedPokemon) {
      console.error(`❌ [MANUAL_REORDER_CORE_${enhancedId}] Pokemon not found at source index`);
      return;
    }
    
    processReorder(currentRankings, sourceIndex, destinationIndex, movedPokemon);
  }, []); // CRITICAL: Empty deps

  // Stable memoization
  const displayRankings = useMemo(() => {
    const source = localRankings.length > 0 ? localRankings : stableRankingsRef.current;
    const result = source.map((pokemon) => ({
      ...pokemon,
      isBeingDragged: draggedPokemonIdRef.current === pokemon.id
    }));
    console.log(`🎯 [MANUAL_REORDER_CORE_${hookId}] displayRankings created from ${source.length} items`);
    return result;
  }, [localRankings, renderTrigger, hookId]); // Include renderTrigger to update when drag state changes

  return {
    displayRankings,
    handleDragStart,
    handleDragEnd,
    handleEnhancedManualReorder,
    isDragging: isDraggingRef.current,
    isUpdating: isUpdatingRef.current
  };
};
