
import { useSensors } from '@dnd-kit/core';
import {
  useSensor,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { useCallback } from 'react';

interface UseDragAndDropProps {
  displayRankings: any[];
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: any[]) => void;
}

export const useDragAndDrop = ({ displayRankings, onManualReorder, onLocalReorder }: UseDragAndDropProps) => {
  console.log(`🚀 [DRAG_DROP_FLOW] ===== useDragAndDrop with Enhanced Flow =====`);
  console.log(`🚀 [DRAG_DROP_FLOW] onManualReorder function exists: ${!!onManualReorder}`);

  // PERFORMANCE FIX: Optimize sensor configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // PERFORMANCE FIX: Memoize drag end handler to prevent recreation
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

    // PERFORMANCE FIX: Only update local state if different from current
    if (activeIndex !== overIndex) {
      // Calculate the new rankings for immediate UI feedback
      const newRankings = arrayMove(displayRankings, activeIndex, overIndex);

      // Update local rankings for immediate UI feedback
      if (onLocalReorder) {
        console.log(`🚀 [DRAG_DROP_FLOW] Updating local rankings for immediate feedback...`);
        onLocalReorder(newRankings);
      }

      // CRITICAL: Call the enhanced manual reorder logic
      if (onManualReorder) {
        console.log(`🚀 [DRAG_DROP_FLOW] ===== CALLING ENHANCED MANUAL REORDER =====`);
        console.log(`🚀 [DRAG_DROP_FLOW] This should trigger TrueSkill updates and implied battles`);
        console.log(`🚀 [DRAG_DROP_FLOW] Calling: onManualReorder(${draggedPokemon.id}, ${activeIndex}, ${overIndex})`);
        
        // Call the enhanced manual reorder logic
        onManualReorder(draggedPokemon.id, activeIndex, overIndex);
        
        console.log(`🚀 [DRAG_DROP_FLOW] Enhanced manual reorder call completed`);
      } else {
        console.error(`🚀 [DRAG_DROP_FLOW] ❌ onManualReorder is not available!`);
      }
    }
    
    console.log(`🚀 [DRAG_DROP_FLOW] ===== DRAG END COMPLETE =====`);
  }, [displayRankings, onManualReorder, onLocalReorder]);

  return { sensors, handleDragEnd };
};
