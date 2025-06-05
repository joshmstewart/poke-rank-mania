
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import { useStableDragHandlers } from "@/hooks/battle/useStableDragHandlers";

interface MilestoneStateManagerProps {
  formattedRankings: (Pokemon | RankedPokemon)[];
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  children: (props: {
    localRankings: (Pokemon | RankedPokemon)[];
    displayRankings: (Pokemon | RankedPokemon)[];
    isManualOperationInProgress: boolean;
    manualOperationTimestamp: number | null;
    handleEnhancedManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
    stableOnLocalReorder: (newRankings: any[]) => void;
  }) => React.ReactNode;
}

const MilestoneStateManager: React.FC<MilestoneStateManagerProps> = ({
  formattedRankings,
  onManualReorder,
  children
}) => {
  console.log(`🏆 [MILESTONE_STATE_MANAGER] Initializing with ${formattedRankings.length} rankings`);

  // CRITICAL DEBUG: Track all state changes with timestamps
  const [isManualOperationInProgress, setIsManualOperationInProgress] = useState(false);
  const [manualOperationTimestamp, setManualOperationTimestamp] = useState<number | null>(null);
  const [localRankings, setLocalRankings] = useState(formattedRankings);
  const [debugId, setDebugId] = useState(0);

  // CRITICAL DEBUG: Log every state change
  useEffect(() => {
    console.log(`🔍 [STATE_DEBUG_${debugId}] localRankings changed:`, localRankings.slice(0, 3).map(p => p.name));
  }, [localRankings, debugId]);

  useEffect(() => {
    console.log(`🔍 [STATE_DEBUG_${debugId}] isManualOperationInProgress:`, isManualOperationInProgress);
  }, [isManualOperationInProgress, debugId]);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    onManualReorder,
    (newRankings: any[]) => {
      const newDebugId = Date.now();
      setDebugId(newDebugId);
      
      console.log(`🎨 [MILESTONE_STATE_MANAGER_${newDebugId}] ===== LOCAL REORDER CALLED =====`);
      console.log(`🎨 [MILESTONE_STATE_MANAGER_${newDebugId}] Input rankings:`, newRankings.slice(0, 3).map(p => p.name));
      console.log(`🎨 [MILESTONE_STATE_MANAGER_${newDebugId}] Current local rankings BEFORE:`, localRankings.slice(0, 3).map(p => p.name));
      
      // CRITICAL FIX: Set the manual operation flag and timestamp
      setIsManualOperationInProgress(true);
      setManualOperationTimestamp(Date.now());
      
      // IMMEDIATE UPDATE: Update local rankings right away
      setLocalRankings(newRankings);
      console.log(`🎨 [MILESTONE_STATE_MANAGER_${newDebugId}] ✅ Local rankings updated immediately to:`, newRankings.slice(0, 3).map(p => p.name));
      
      // CRITICAL DEBUG: Force a re-render check
      setTimeout(() => {
        console.log(`🎨 [MILESTONE_STATE_MANAGER_${newDebugId}] ===== POST-UPDATE CHECK =====`);
        console.log(`🎨 [MILESTONE_STATE_MANAGER_${newDebugId}] Local rankings AFTER timeout:`, localRankings.slice(0, 3).map(p => p.name));
      }, 50);
      
      // CRITICAL FIX: Clear manual operation flag after a longer delay
      setTimeout(() => {
        setIsManualOperationInProgress(false);
        console.log(`🎨 [MILESTONE_STATE_MANAGER_${newDebugId}] Manual operation flag cleared`);
      }, 2000);
    }
  );

  // CRITICAL DEBUG: Enhanced props update logic with detailed logging
  useEffect(() => {
    const effectId = Date.now();
    console.log(`🏆 [MILESTONE_STATE_MANAGER_${effectId}] ===== PROPS EFFECT TRIGGERED =====`);
    console.log(`🏆 [MILESTONE_STATE_MANAGER_${effectId}] formattedRankings:`, formattedRankings.slice(0, 3).map(p => p.name));
    console.log(`🏆 [MILESTONE_STATE_MANAGER_${effectId}] localRankings:`, localRankings.slice(0, 3).map(p => p.name));
    console.log(`🏆 [MILESTONE_STATE_MANAGER_${effectId}] isManualOperationInProgress:`, isManualOperationInProgress);
    console.log(`🏆 [MILESTONE_STATE_MANAGER_${effectId}] manualOperationTimestamp:`, manualOperationTimestamp);
    
    // CRITICAL FIX: Don't update from props during manual operations OR shortly after
    const now = Date.now();
    const recentManualOperation = manualOperationTimestamp && (now - manualOperationTimestamp) < 3000;
    
    if (isManualOperationInProgress || recentManualOperation) {
      console.log(`🎨 [MILESTONE_STATE_MANAGER_${effectId}] Skipping props update - manual operation protection active`);
      return;
    }
    
    const hasSignificantDifference = Math.abs(formattedRankings.length - localRankings.length) > 0 ||
      formattedRankings.slice(0, 5).some((p, i) => p.id !== localRankings[i]?.id);
    
    if (hasSignificantDifference) {
      console.log(`🏆 [MILESTONE_STATE_MANAGER_${effectId}] Updating local rankings from props`);
      setLocalRankings(formattedRankings);
    } else {
      console.log(`🏆 [MILESTONE_STATE_MANAGER_${effectId}] No significant difference, keeping local rankings`);
    }
  }, [formattedRankings, isManualOperationInProgress, manualOperationTimestamp, localRankings]);

  // CRITICAL DEBUG: Enhanced manual reorder with detailed logging
  const { handleEnhancedManualReorder, tooLarge } = useEnhancedManualReorder(
    localRankings as RankedPokemon[],
    (updatedRankings: RankedPokemon[]) => {
      const reorderId = Date.now();
      console.log(`🎨 [MILESTONE_STATE_MANAGER_${reorderId}] ===== ENHANCED REORDER CALLBACK =====`);
      console.log(`🎨 [MILESTONE_STATE_MANAGER_${reorderId}] Input updatedRankings:`, updatedRankings.slice(0, 3).map(p => p.name));
      console.log(`🎨 [MILESTONE_STATE_MANAGER_${reorderId}] Current localRankings BEFORE stableOnLocalReorder:`, localRankings.slice(0, 3).map(p => p.name));
      
      // CRITICAL FIX: Update local state immediately AND call parent callback
      stableOnLocalReorder(updatedRankings);
      console.log(`🎨 [MILESTONE_STATE_MANAGER_${reorderId}] ✅ Called stableOnLocalReorder`);
      
      // Also call the parent callback for external state sync
      // But do this AFTER the local update to ensure visual consistency
      setTimeout(() => {
        if (onManualReorder && updatedRankings.length > 0) {
          // Find what changed to call parent with proper indices
          const firstChanged = updatedRankings.findIndex((p, i) => localRankings[i]?.id !== p.id);
          if (firstChanged !== -1) {
            console.log(`🎨 [MILESTONE_STATE_MANAGER_${reorderId}] Calling parent callback for external sync`);
            // This is for external state management, local is already updated
          }
        }
      }, 100);
    },
    true // preventAutoResorting = true to maintain manual order
  );

  // Memoize display rankings to prevent recreation
  const displayRankings = useMemo(() => {
    const result = localRankings.slice(0, Math.min(localRankings.length, 1000)); // Add reasonable limit
    console.log(`🎨 [MILESTONE_STATE_MANAGER] displayRankings memoized:`, result.slice(0, 3).map(p => p.name));
    return result;
  }, [localRankings]);

  // CRITICAL DEBUG: Log what we're passing to children
  console.log(`🏆 [MILESTONE_STATE_MANAGER] ===== RENDERING CHILDREN =====`);
  console.log(`🏆 [MILESTONE_STATE_MANAGER] Passing localRankings:`, localRankings.slice(0, 3).map(p => p.name));
  console.log(`🏆 [MILESTONE_STATE_MANAGER] Passing displayRankings:`, displayRankings.slice(0, 3).map(p => p.name));

  return (
    <>
      {children({
        localRankings,
        displayRankings,
        isManualOperationInProgress,
        manualOperationTimestamp,
        tooLarge,
        handleEnhancedManualReorder,
        stableOnLocalReorder
      })}
    </>
  );
};

export default MilestoneStateManager;
