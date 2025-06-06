
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
  console.log(`🚀 [DRAG_DROP_FLOW] ===== useDragAndDrop with Enhanced Flow =====`);
  console.log(`🚀 [DRAG_DROP_FLOW] onManualReorder function exists: ${!!onManualReorder}`);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] ===== DRAG END TRIGGERED =====`);
    
    const { active, over } = event;

    if (!over || active.id === over.id) {
      console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] ❌ No drop target or same position - exiting`);
      return;
    }

    const activeIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
    const overIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);
    
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] CRITICAL INDEX CALCULATION:`);
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] - Active Pokemon ID: ${active.id}`);
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] - Over Pokemon ID: ${over.id}`);
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] - Active Index: ${activeIndex}`);
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] - Over Index: ${overIndex}`);
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] - displayRankings length: ${displayRankings.length}`);

    if (activeIndex === -1 || overIndex === -1) {
      console.error(`🚀🚀🚀 [DRAG_DROP_CRITICAL] ❌ Invalid indices - activeIndex: ${activeIndex}, overIndex: ${overIndex}`);
      console.error(`🚀🚀🚀 [DRAG_DROP_CRITICAL] ❌ Active ID not found:`, activeIndex === -1);
      console.error(`🚀🚀🚀 [DRAG_DROP_CRITICAL] ❌ Over ID not found:`, overIndex === -1);
      console.error(`🚀🚀🚀 [DRAG_DROP_CRITICAL] ❌ All Pokemon IDs:`, displayRankings.map(p => p.id));
      return;
    }

    const draggedPokemon = displayRankings[activeIndex];
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] Dragged Pokemon: ${draggedPokemon.name} (${draggedPokemon.id})`);
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] Source position: ${activeIndex + 1}`);
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] Target position: ${overIndex + 1}`);

    // CRITICAL: Log if this is Charmander
    if (draggedPokemon.id === 4) {
      console.log(`🧊🧊🧊 [DRAG_DROP_CRITICAL] ===== CHARMANDER DRAG DETECTED =====`);
      console.log(`🧊🧊🧊 [DRAG_DROP_CRITICAL] User wants to move Charmander to position ${overIndex + 1}`);
      console.log(`🧊🧊🧊 [DRAG_DROP_CRITICAL] Current position: ${activeIndex + 1}`);
      console.log(`🧊🧊🧊 [DRAG_DROP_CRITICAL] Target position: ${overIndex + 1}`);
    }

    // Calculate the new rankings for immediate UI feedback
    const newRankings = arrayMove(displayRankings, activeIndex, overIndex);
    
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] AFTER arrayMove in useDragAndDrop:`);
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] Pokemon at target index ${overIndex}:`, newRankings[overIndex]?.name, '(', newRankings[overIndex]?.id, ')');
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] Expected Pokemon:`, draggedPokemon.name, '(', draggedPokemon.id, ')');
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] Local arrayMove SUCCESS:`, newRankings[overIndex]?.id === draggedPokemon.id ? 'YES' : 'NO');

    // Update local rankings for immediate UI feedback
    if (onLocalReorder) {
      console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] Calling onLocalReorder for immediate feedback...`);
      onLocalReorder(newRankings);
    }

    // CRITICAL: Call the enhanced manual reorder logic
    if (onManualReorder) {
      console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] ===== CALLING ENHANCED MANUAL REORDER =====`);
      console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] This should trigger TrueSkill updates and implied battles`);
      console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] Calling: onManualReorder(${draggedPokemon.id}, ${activeIndex}, ${overIndex})`);
      
      if (draggedPokemon.id === 4) {
        console.log(`🧊🧊🧊 [DRAG_DROP_CRITICAL] CHARMANDER: Passing indices ${activeIndex} -> ${overIndex} to enhanced reorder`);
      }
      
      // Call the enhanced manual reorder logic
      onManualReorder(draggedPokemon.id, activeIndex, overIndex);
      
      console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] Enhanced manual reorder call completed`);
    } else {
      console.error(`🚀🚀🚀 [DRAG_DROP_CRITICAL] ❌ onManualReorder is not available!`);
    }
    
    console.log(`🚀🚀🚀 [DRAG_DROP_CRITICAL] ===== DRAG END COMPLETE =====`);
  };

  return { sensors, handleDragEnd };
};
