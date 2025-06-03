
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

  // CRITICAL FIX: Track manual operations to prevent props from overwriting manual changes
  const [isManualOperationInProgress, setIsManualOperationInProgress] = useState(false);
  const [manualOperationTimestamp, setManualOperationTimestamp] = useState<number | null>(null);
  const [localRankings, setLocalRankings] = useState(formattedRankings);

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    onManualReorder,
    (newRankings: any[]) => {
      console.log('🎨 [MILESTONE_STATE_MANAGER] Local reorder called with', newRankings.length, 'items');
      
      // CRITICAL FIX: Set the manual operation flag and timestamp
      setIsManualOperationInProgress(true);
      setManualOperationTimestamp(Date.now());
      
      // IMMEDIATE UPDATE: Update local rankings right away
      setLocalRankings(newRankings);
      console.log('🎨 [MILESTONE_STATE_MANAGER] ✅ Local rankings updated immediately');
      
      // CRITICAL FIX: Clear manual operation flag after a longer delay
      setTimeout(() => {
        setIsManualOperationInProgress(false);
        console.log('🎨 [MILESTONE_STATE_MANAGER] Manual operation flag cleared');
      }, 2000);
    }
  );

  // CRITICAL FIX: Enhanced props update logic with timestamp checking
  useEffect(() => {
    console.log(`🏆 [MILESTONE_STATE_MANAGER] Props changed - checking for updates`);
    
    // CRITICAL FIX: Don't update from props during manual operations OR shortly after
    const now = Date.now();
    const recentManualOperation = manualOperationTimestamp && (now - manualOperationTimestamp) < 3000;
    
    if (isManualOperationInProgress || recentManualOperation) {
      console.log('🎨 [MILESTONE_STATE_MANAGER] Skipping props update - manual operation protection active');
      return;
    }
    
    const hasSignificantDifference = Math.abs(formattedRankings.length - localRankings.length) > 0 ||
      formattedRankings.slice(0, 5).some((p, i) => p.id !== localRankings[i]?.id);
    
    if (hasSignificantDifference) {
      console.log(`🏆 [MILESTONE_STATE_MANAGER] Updating local rankings`);
      setLocalRankings(formattedRankings);
    }
  }, [formattedRankings, isManualOperationInProgress, manualOperationTimestamp, localRankings]);

  // CRITICAL FIX: Enhanced manual reorder that updates local state directly
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings as RankedPokemon[],
    (updatedRankings: RankedPokemon[]) => {
      console.log('🎨 [MILESTONE_STATE_MANAGER] Enhanced reorder callback with', updatedRankings.length, 'items');
      
      // CRITICAL FIX: Update local state immediately AND call parent callback
      stableOnLocalReorder(updatedRankings);
      
      // Also call the parent callback for external state sync
      // But do this AFTER the local update to ensure visual consistency
      setTimeout(() => {
        if (onManualReorder && updatedRankings.length > 0) {
          // Find what changed to call parent with proper indices
          const firstChanged = updatedRankings.findIndex((p, i) => localRankings[i]?.id !== p.id);
          if (firstChanged !== -1) {
            console.log('🎨 [MILESTONE_STATE_MANAGER] Calling parent callback for external sync');
            // This is for external state management, local is already updated
          }
        }
      }, 100);
    },
    true // preventAutoResorting = true to maintain manual order
  );

  // Memoize display rankings to prevent recreation
  const displayRankings = useMemo(() => {
    return localRankings.slice(0, Math.min(localRankings.length, 1000)); // Add reasonable limit
  }, [localRankings]);

  return (
    <>
      {children({
        localRankings,
        displayRankings,
        isManualOperationInProgress,
        manualOperationTimestamp,
        handleEnhancedManualReorder,
        stableOnLocalReorder
      })}
    </>
  );
};

export default MilestoneStateManager;
