
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

  // CRITICAL FIX: Track manual operations to prevent props from overwriting manual changes
  const [isManualOperationInProgress, setIsManualOperationInProgress] = useState(false);
  const [manualOperationTimestamp, setManualOperationTimestamp] = useState<number | null>(null);

  // CRITICAL DEBUG: Log incoming props to track visual updates with persistent logs
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== MILESTONE VIEW RENDER =====`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length: ${formattedRankings.length}`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] First 5 rankings: ${formattedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`).join(', ')}`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Render timestamp: ${Date.now()}`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Manual operation in progress: ${isManualOperationInProgress}`);
  persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Manual operation timestamp: ${manualOperationTimestamp}`);
  
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== MILESTONE VIEW RENDER =====');
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length:', formattedRankings.length);
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] First 5 rankings:', formattedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`));
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] Render timestamp:', Date.now());
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] Manual operation in progress:', isManualOperationInProgress);
  console.log('🎨 [MILESTONE_VISUAL_DEBUG] Manual operation timestamp:', manualOperationTimestamp);

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

  // Use stable drag handlers with CRITICAL FIX: don't call parent callback
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
      
      // CRITICAL FIX: Set the manual operation flag and timestamp
      setIsManualOperationInProgress(true);
      setManualOperationTimestamp(Date.now());
      setLocalRankings(newRankings);
      
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ✅ setLocalRankings called`);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ✅ setLocalRankings called');
      
      // CRITICAL FIX: Clear manual operation flag after a longer delay
      setTimeout(() => {
        setIsManualOperationInProgress(false);
        persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ✅ Manual operation flag cleared after timeout`);
        console.log('🎨 [MILESTONE_VISUAL_DEBUG] ✅ Manual operation flag cleared after timeout');
      }, 2000); // Longer timeout to prevent props from overwriting
    }
  );

  // CRITICAL FIX: Enhanced props update logic with timestamp checking
  useEffect(() => {
    console.log(`🏆 [MILESTONE_STABLE] Props changed - checking for updates`);
    
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== PROPS EFFECT TRIGGERED =====`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length: ${formattedRankings.length}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] localRankings length: ${localRankings.length}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] isManualOperationInProgress: ${isManualOperationInProgress}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] manualOperationTimestamp: ${manualOperationTimestamp}`);
    
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== PROPS EFFECT TRIGGERED =====');
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length:', formattedRankings.length);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] localRankings length:', localRankings.length);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] isManualOperationInProgress:', isManualOperationInProgress);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] manualOperationTimestamp:', manualOperationTimestamp);
    
    // CRITICAL FIX: Don't update from props during manual operations OR shortly after
    const now = Date.now();
    const recentManualOperation = manualOperationTimestamp && (now - manualOperationTimestamp) < 3000; // 3 second protection window
    
    if (isManualOperationInProgress || recentManualOperation) {
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ⚠️ SKIPPING PROPS UPDATE - Manual operation protection active`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Time since manual operation: ${manualOperationTimestamp ? now - manualOperationTimestamp : 'N/A'}ms`);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ⚠️ SKIPPING PROPS UPDATE - Manual operation protection active');
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] Time since manual operation:', manualOperationTimestamp ? now - manualOperationTimestamp : 'N/A', 'ms');
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
  }, [formattedRankings, isManualOperationInProgress, manualOperationTimestamp]);

  // CRITICAL FIX: Enhanced manual reorder that doesn't call parent callback
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    localRankings as RankedPokemon[],
    (updatedRankings: RankedPokemon[]) => {
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== ENHANCED REORDER CALLBACK =====`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Updated rankings length: ${updatedRankings.length}`);
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] First 5 updated rankings: ${updatedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${p.score.toFixed(2)})`).join(', ')}`);
      
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== ENHANCED REORDER CALLBACK =====');
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] Updated rankings length:', updatedRankings.length);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] First 5 updated rankings:', updatedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${p.score.toFixed(2)})`));
      
      // CRITICAL FIX: Only update local state, DON'T call parent callback to prevent props loop
      stableOnLocalReorder(updatedRankings);
      
      persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ✅ Local reorder called instead of parent callback`);
      console.log('🎨 [MILESTONE_VISUAL_DEBUG] ✅ Local reorder called instead of parent callback');
    },
    true // preventAutoResorting = true to maintain manual order
  );

  // FIXED: Simplified drag and drop that only uses enhanced reorder
  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
      console.log(`🏆 [MILESTONE_STABLE] Drag completed: ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
      
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
  // CRITICAL FIX: Prevent re-renders during manual operations to avoid props overwriting local state
  
  // Only allow re-renders for major changes like battle count or tier changes
  const shouldPreventRerender = (
    prevProps.battlesCompleted === nextProps.battlesCompleted &&
    prevProps.activeTier === nextProps.activeTier &&
    prevProps.milestoneDisplayCount === nextProps.milestoneDisplayCount
    // Remove ranking comparison to prevent props from triggering re-renders during manual operations
  );
  
  console.log('🎨 [MILESTONE_MEMO_DEBUG] Enhanced memo comparison result:', shouldPreventRerender ? 'PREVENTING' : 'ALLOWING', 'rerender');
  
  if (!shouldPreventRerender) {
    console.log('🎨 [MILESTONE_MEMO_DEBUG] Allowing rerender because of major change (battles/tier/count)');
  }
  
  return shouldPreventRerender;
});

DraggableMilestoneView.displayName = 'DraggableMilestoneView';

export default DraggableMilestoneView;
