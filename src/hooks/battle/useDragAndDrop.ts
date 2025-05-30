
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

interface UseDragAndDropProps {
  displayRankings: any[];
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: any[]) => void;
}

export const useDragAndDrop = ({ displayRankings, onManualReorder, onLocalReorder }: UseDragAndDropProps) => {
  console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] ===== useDragAndDrop with Enhanced Manual Reorder =====`);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] ===== DRAG END START =====`);
    
    const { active, over } = event;

    if (!over || active.id === over.id) {
      console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] ❌ No drop target or same position - exiting`);
      return;
    }

    const activeIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
    const overIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);
    
    console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] Drag details:`);
    console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] - Active Pokemon ID: ${active.id}`);
    console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] - Over Pokemon ID: ${over.id}`);
    console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] - Active Index: ${activeIndex}`);
    console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] - Over Index: ${overIndex}`);

    if (activeIndex === -1 || overIndex === -1) {
      console.error(`🚨🚨🚨 [DRAG_DROP_ENHANCED] ❌ Invalid indices - activeIndex: ${activeIndex}, overIndex: ${overIndex}`);
      return;
    }

    const draggedPokemon = displayRankings[activeIndex];
    console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] Dragged Pokemon: ${draggedPokemon.name} (${draggedPokemon.id})`);

    // Calculate the new rankings for immediate UI feedback
    const newRankings = arrayMove(displayRankings, activeIndex, overIndex);

    // Update local rankings for immediate UI feedback
    if (onLocalReorder) {
      console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] Updating local rankings for immediate feedback...`);
      onLocalReorder(newRankings);
    }

    // CRITICAL FIX: Ensure the enhanced manual reorder handler is called properly
    if (onManualReorder) {
      console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] ===== CALLING ENHANCED MANUAL REORDER =====`);
      console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] This should trigger TrueSkill updates automatically`);
      console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] Calling: onManualReorder(${draggedPokemon.id}, ${activeIndex}, ${overIndex})`);
      
      // Call the enhanced manual reorder logic
      onManualReorder(draggedPokemon.id, activeIndex, overIndex);
      
      console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] Enhanced manual reorder call completed`);
    } else {
      console.error(`🚨🚨🚨 [DRAG_DROP_ENHANCED] ❌ onManualReorder is not available!`);
    }
    
    console.log(`🚨🚨🚨 [DRAG_DROP_ENHANCED] ===== DRAG END COMPLETE =====`);
  };

  return { sensors, handleDragEnd };
};
