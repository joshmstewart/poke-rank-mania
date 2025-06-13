
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
  // Optimized sensor configuration for maximum responsiveness
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 0,
        tolerance: 2,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    }),
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

    // Optimistic UI update - immediate visual feedback
    const newRankings = arrayMove(displayRankings, activeIndex, overIndex);
    if (onLocalReorder) {
      onLocalReorder(newRankings);
    }

    // Background TrueSkill update
    if (onManualReorder) {
      onManualReorder(draggedPokemon.id, activeIndex, overIndex);
    }
  };

  return { sensors, handleDragEnd };
};
