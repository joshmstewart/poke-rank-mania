
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
    const overIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);
    
    if (activeIndex === -1 || overIndex === -1) {
      return;
    }

    const draggedPokemon = displayRankings[activeIndex];

    // Calculate the new rankings for immediate UI feedback
    const newRankings = arrayMove(displayRankings, activeIndex, overIndex);
    
    // Update local rankings for immediate UI feedback
    if (onLocalReorder) {
      onLocalReorder(newRankings);
    }

    // Call the enhanced manual reorder logic
    if (onManualReorder) {
      onManualReorder(draggedPokemon.id, activeIndex, overIndex);
    }
  };

  return { sensors, handleDragEnd };
};
