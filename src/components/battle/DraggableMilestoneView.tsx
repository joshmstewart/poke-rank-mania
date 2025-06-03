
import React, { useState, useEffect, useMemo } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { Button } from "@/components/ui/button";
import InfiniteScrollHandler from "./InfiniteScrollHandler";
import AutoBattleLogsModal from "./AutoBattleLogsModal";
import { usePendingRefinementsManager } from "@/hooks/battle/usePendingRefinementsManager";
import { useDragAndDrop } from "@/hooks/battle/useDragAndDrop";
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import DragDropGridMemoized from "./DragDropGridMemoized";
import { useStableDragHandlers } from "@/hooks/battle/useStableDragHandlers";

// CRITICAL: Persistent logging utility that survives DevTools crashes
const persistentLog = {
  logs: [] as string[],
  
  add: (message: string) => {
    const timestamp = Date.now();
    const logEntry = `[${timestamp}] ${message}`;
    persistentLog.logs.push(logEntry);
    
    // Save to localStorage immediately
    try {
      localStorage.setItem('debugPerfLogs', JSON.stringify(persistentLog.logs));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    
    // Also log to console for immediate viewing
    console.log(`🔍 [PERSISTENT_LOG] ${logEntry}`);
  }
};

interface DraggableMilestoneViewProps {
  formattedRankings: (Pokemon | RankedPokemon)[];
  battlesCompleted: number;
  activeTier: TopNOption;
  milestoneDisplayCount: number;
  onContinueBattles: () => void;
  onLoadMore: () => void;
  getMaxItemsForTier: () => number;
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  pendingRefinements?: Set<number>;
}

const DraggableMilestoneView: React.FC<DraggableMilestoneViewProps> = React.memo(({
  formattedRankings,
  battlesCompleted,
  activeTier,
  milestoneDisplayCount,
  onContinueBattles,
  onLoadMore,
  getMaxItemsForTier,
  onManualReorder,
  pendingRefinements = new Set<number>()
}) => {
  console.log(`🏆 [MILESTONE_STABLE] Rendering milestone view with ${formattedRankings.length} rankings`);

  // CRITICAL FIX: Add flag to track when we're in a manual operation
  const [isManualOperationInProgress, setIsManualOperationInProgress] = useState(false);

  // CRITICAL DEBUG: Log incoming props to track visual updates with persistent logs
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== MILESTONE VIEW RENDER =====`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length: ${formattedRankings.length}`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] First 5 rankings: ${formattedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`).join(', ')}`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Render timestamp: ${Date.now()}`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Manual operation in progress: ${isManualOperationInProgress}`);
  
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== MILESTONE VIEW RENDER =====');
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length:', formattedRankings.length);
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] First 5 rankings:', formattedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`));
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] Render timestamp:', Date.now());
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] Manual operation in progress:', isManualOperationInProgress);

  const [localRankings, setLocalRankings] = useState(formattedRankings);
  
  // CRITICAL DEBUG: Log local state changes with persistent logs
  useEffect(() => {
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== LOCAL STATE UPDATE =====`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] localRankings updated to: ${localRankings.length} items`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] First 5 local rankings: ${localRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`).join(', ')}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Local state timestamp: ${Date.now()}`);
    
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== LOCAL STATE UPDATE =====');
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] localRankings updated to:', localRankings.length, 'items');
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] First 5 local rankings:', localRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`));
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] Local state timestamp:', Date.now());
  }, [localRankings]);
  
  const {
    localPendingRefinements,
    pendingBattleCounts,
    markAsPending,
    updateFromProps
  } = usePendingRefinementsManager(pendingRefinements);
  
  const maxItems = getMaxItemsForTier();
  
  // Memoize display rankings to prevent recreation
  const displayRankings = useMemo(() => {
    const result = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
    
    // CRITICAL DEBUG: Log what gets displayed with persistent logs
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== DISPLAY RANKINGS MEMOIZED =====`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] displayRankings length: ${result.length}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] First 5 display rankings: ${result.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`).join(', ')}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Display memoization timestamp: ${Date.now()}`);
    
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== DISPLAY RANKINGS MEMOIZED =====');
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] displayRankings length:', result.length);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] First 5 display rankings:', result.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`));
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] Display memoization timestamp:', Date.now());
    
    return result;
  }, [localRankings, milestoneDisplayCount, maxItems]);
  
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  // Use stable drag handlers
  const { stableOnManualReorder, stableOnLocalReorder } = useStableDragHandlers(
    onManualReorder,
    (newRankings: any[]) => {
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== STABLE LOCAL REORDER CALLED =====`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] New rankings length: ${newRankings.length}`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] First 5 new rankings: ${newRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`).join(', ')}`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] About to call setLocalRankings...`);
      
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== STABLE LOCAL REORDER CALLED =====');
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] New rankings length:', newRankings.length);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] First 5 new rankings:', newRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`));
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] About to call setLocalRankings...');
      setLocalRankings(newRankings);
      
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ✅ setLocalRankings called`);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ✅ setLocalRankings called');
    }
  );

  // CRITICAL FIX: Only update local state from props when NOT in a manual operation
  useEffect(() => {
    console.log(`🏆 [MILESTONE_STABLE] Props changed - checking for updates`);
    
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== PROPS EFFECT TRIGGERED =====`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length: ${formattedRankings.length}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] localRankings length: ${localRankings.length}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] isManualOperationInProgress: ${isManualOperationInProgress}`);
    
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== PROPS EFFECT TRIGGERED =====');
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length:', formattedRankings.length);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] localRankings length:', localRankings.length);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] isManualOperationInProgress:', isManualOperationInProgress);
    
    // CRITICAL FIX: Don't update from props during manual operations
    if (isManualOperationInProgress) {
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ⚠️ SKIPPING PROPS UPDATE - Manual operation in progress`);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ⚠️ SKIPPING PROPS UPDATE - Manual operation in progress');
      return;
    }
    
    const hasSignificantDifference = Math.abs(formattedRankings.length - localRankings.length) > 0 ||
      formattedRankings.slice(0, 5).some((p, i) => p.id !== localRankings[i]?.id);
    
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] hasSignificantDifference: ${hasSignificantDifference}`);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] hasSignificantDifference:', hasSignificantDifference);
    
    if (hasSignificantDifference) {
      console.log(`🏆 [MILESTONE_STABLE] Updating local rankings`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== UPDATING LOCAL FROM PROPS =====`);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== UPDATING LOCAL FROM PROPS =====');
      setLocalRankings(formattedRankings);
    }
  }, [formattedRankings, isManualOperationInProgress]);

  // FIXED: Use only the enhanced manual reorder
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings as RankedPokemon[],
    (updatedRankings: RankedPokemon[]) => {
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== ENHANCED REORDER CALLBACK =====`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Updated rankings length: ${updatedRankings.length}`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] First 5 updated rankings: ${updatedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${p.score.toFixed(2)})`).join(', ')}`);
      
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== ENHANCED REORDER CALLBACK =====');
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] Updated rankings length:', updatedRankings.length);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] First 5 updated rankings:', updatedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${p.score.toFixed(2)})`));
      stableOnLocalReorder(updatedRankings);
      
      // CRITICAL FIX: Clear manual operation flag after a delay to allow for score updates
      setTimeout(() => {
        setIsManualOperationInProgress(false);
        persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ✅ Manual operation flag cleared`);
        console.log('🎨 [MILESTONE_VISUAL_DEBUG] ✅ Manual operation flag cleared');
      }, 1000);
    },
    true // preventAutoResorting = true to maintain manual order
  );

  // FIXED: Simplified drag and drop that only uses enhanced reorder
  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
      console.log(`🏆 [MILESTONE_STABLE] Drag completed: ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
      
      // CRITICAL FIX: Set manual operation flag at start of drag
      setIsManualOperationInProgress(true);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ✅ Manual operation flag set - blocking props updates`);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ✅ Manual operation flag set - blocking props updates');
      
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== DRAG OPERATION INITIATED =====`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] draggedPokemonId: ${draggedPokemonId}`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] sourceIndex: ${sourceIndex}`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] destinationIndex: ${destinationIndex}`);
      
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== DRAG OPERATION INITIATED =====');
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] draggedPokemonId:', draggedPokemonId);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] sourceIndex:', sourceIndex);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] destinationIndex:', destinationIndex);
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    },
    onLocalReorder: stableOnLocalReorder
  });

  // Memoized header content
  const headerContent = useMemo(() => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <h1 className="text-xl font-bold text-gray-800">
          Milestone: {battlesCompleted} Battles
        </h1>
        <span className="text-gray-500 text-sm">
          (Showing {displayRankings.length} of {activeTier === "All" ? maxItems : Math.min(Number(activeTier), maxItems)})
        </span>
        <AutoBattleLogsModal />
      </div>
      
      <Button 
        onClick={onContinueBattles}
        className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium"
      >
        Continue Battles
      </Button>
    </div>
  ), [battlesCompleted, displayRankings.length, activeTier, maxItems, onContinueBattles]);

  // CRITICAL DEBUG: Log before rendering DragDropGrid with persistent logs
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== ABOUT TO RENDER GRID =====`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] displayRankings passed to grid: ${displayRankings.length}`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Grid will show: ${displayRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`).join(', ')}`);
  
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== ABOUT TO RENDER GRID =====');
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] displayRankings passed to grid:', displayRankings.length);
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] Grid will show:', displayRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`));

  return (
    <div className="bg-white p-6 w-full max-w-7xl mx-auto">
      {headerContent}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <DragDropGridMemoized
          displayRankings={displayRankings}
          localPendingRefinements={localPendingRefinements}
          pendingBattleCounts={pendingBattleCounts}
        />
      </DndContext>

      <InfiniteScrollHandler 
        hasMoreToLoad={hasMoreToLoad}
        currentCount={displayRankings.length}
        maxItems={maxItems}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // CRITICAL FIX: During manual operations, prevent ALL re-renders by always returning true
  // This ensures the component doesn't re-render and revert the manual changes
  
  // Simple comparison - only allow re-renders for major changes like battle count
  const shouldPreventRerender = (
    prevProps.battlesCompleted === nextProps.battlesCompleted &&
    prevProps.activeTier === nextProps.activeTier &&
    prevProps.milestoneDisplayCount === nextProps.milestoneDisplayCount &&
    Math.abs(prevProps.formattedRankings.length - nextProps.formattedRankings.length) < 10 // Allow small changes
  );
  
  console.log('🎨 [MILESTONE_MEMO_DEBUG] Simplified memo comparison result:', shouldPreventRerender ? 'PREVENTING' : 'ALLOWING', 'rerender');
  
  if (!shouldPreventRerender) {
    console.log('🎨 [MILESTONE_MEMO_DEBUG] Allowing rerender because of major change (battles/tier/count)');
  }
  
  return shouldPreventRerender;
});

DraggableMilestoneView.displayName = 'DraggableMilestoneView';

export default DraggableMilestoneView;
