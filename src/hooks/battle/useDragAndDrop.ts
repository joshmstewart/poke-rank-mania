import { useSensors } from '@dnd-kit/core';
import {
  useSensor,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';

interface UseDragAndDropProps {
  displayRankings: any[];
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: any[]) => void;
}

export const useDragAndDrop = ({ displayRankings, onManualReorder, onLocalReorder }: UseDragAndDropProps) => {
  console.log(`🚀 [DRAG_DROP_FLOW] ===== useDragAndDrop with Enhanced Flow =====`);
  console.log(`🚀 [DRAG_DROP_FLOW] onManualReorder function exists: ${!!onManualReorder}`);

  // Optimized sensor configuration for immediate drag response
  const sensors = useSensors(
    // Pointer sensor with minimal activation constraints for instant drag
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced from 8px - minimal movement to start drag
        // Removed delay completely for instant response
        tolerance: 2, // Reduced tolerance for more precise activation
      },
    }),
    // Touch sensor optimized for immediate response
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50, // Reduced from 200ms to minimal delay for touch
        tolerance: 3, // Reduced tolerance for more responsive touch
      },
    }),
    // Keyboard sensor for accessibility
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
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
    
    console.log(`🚀 [DRAG_DROP_FLOW] ===== DRAG END COMPLETE =====`);
  };

  return { sensors, handleDragEnd };
};
