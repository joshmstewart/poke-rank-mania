
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { useCallback, useMemo, useRef } from 'react';
import { useRenderTracker } from './useRenderTracker';

interface UseDragAndDropProps {
  displayRankings: any[];
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: any[]) => void;
}

export const useDragAndDrop = ({ displayRankings, onManualReorder, onLocalReorder }: UseDragAndDropProps) => {
  // Track renders for performance debugging
  useRenderTracker('useDragAndDrop', { 
    rankingsCount: displayRankings.length,
    hasManualReorder: !!onManualReorder 
  });

  console.log(`🚀 [DRAG_DROP_FLOW] ===== useDragAndDrop with Enhanced Flow =====`);
  console.log(`🚀 [DRAG_DROP_FLOW] onManualReorder function exists: ${!!onManualReorder}`);

  // Stable reference to prevent recreation
  const onManualReorderRef = useRef(onManualReorder);
  const onLocalReorderRef = useRef(onLocalReorder);
  
  // Update refs when props change
  onManualReorderRef.current = onManualReorder;
  onLocalReorderRef.current = onLocalReorder;

  // PERFORMANCE FIX: Optimize sensor configuration with memoization
  const sensors = useMemo(() => useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  ), []);

  // CRITICAL FIX: Only call manual reorder, which handles everything including order preservation
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🚀 [DRAG_DROP_FLOW] ===== DRAG END TRIGGERED =====`);
    
    const { active, over } = event;

    if (!over || active.id === over.id) {
      console.log(`🚀 [DRAG_DROP_FLOW] ❌ No drop target or same position - exiting`);
      return;
    }

    const activeIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
    const overIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);
    
    console.log(`🚀 [DRAG_DROP_FLOW] Drag details:`);
    console.log(`🚀 [DRAG_DROP_FLOW] - Active Pokemon ID: ${active.id}`);
    console.log(`🚀 [DRAG_DROP_FLOW] - Over Pokemon ID: ${over.id}`);
    console.log(`🚀 [DRAG_DROP_FLOW] - Active Index: ${activeIndex}`);
    console.log(`🚀 [DRAG_DROP_FLOW] - Over Index: ${overIndex}`);

    if (activeIndex === -1 || overIndex === -1) {
      console.error(`🚀 [DRAG_DROP_FLOW] ❌ Invalid indices - activeIndex: ${activeIndex}, overIndex: ${overIndex}`);
      return;
    }

    const draggedPokemon = displayRankings[activeIndex];
    console.log(`🚀 [DRAG_DROP_FLOW] Dragged Pokemon: ${draggedPokemon.name} (${draggedPokemon.id})`);

    // CRITICAL FIX: Only call manual reorder - it handles both order preservation AND TrueSkill updates
    if (activeIndex !== overIndex) {
      if (onManualReorderRef.current) {
        console.log(`🚀 [DRAG_DROP_FLOW] ===== CALLING ENHANCED MANUAL REORDER ONLY =====`);
        console.log(`🚀 [DRAG_DROP_FLOW] This will handle order preservation AND TrueSkill updates`);
        console.log(`🚀 [DRAG_DROP_FLOW] Calling: onManualReorder(${draggedPokemon.id}, ${activeIndex}, ${overIndex})`);
        
        // Call manual reorder directly - it handles everything
        onManualReorderRef.current(draggedPokemon.id, activeIndex, overIndex);
        console.log(`🚀 [DRAG_DROP_FLOW] Enhanced manual reorder call completed`);
      } else {
        console.error(`🚀 [DRAG_DROP_FLOW] ❌ onManualReorder is not available!`);
      }
    }
    
    console.log(`🚀 [DRAG_DROP_FLOW] ===== DRAG END COMPLETE =====`);
  }, [displayRankings]); // Only depend on displayRankings, not the functions

  return { sensors, handleDragEnd };
};
