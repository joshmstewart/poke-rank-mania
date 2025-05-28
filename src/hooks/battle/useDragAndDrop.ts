
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback } from 'react';
import { Pokemon, RankedPokemon } from "@/services/pokemon";

interface UseDragAndDropProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (callback: (current: (Pokemon | RankedPokemon)[]) => (Pokemon | RankedPokemon)[]) => void;
}

export const useDragAndDrop = ({ displayRankings, onManualReorder, onLocalReorder }: UseDragAndDropProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8 for more responsive drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
      const newIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log(`🔄 [DRAG_REORDER] Moving Pokemon ${active.id} from position ${oldIndex + 1} to ${newIndex + 1}`);
        
        // Update local rankings immediately for visual feedback
        onLocalReorder(current => {
          const newRankings = [...current];
          const [removed] = newRankings.splice(oldIndex, 1);
          newRankings.splice(newIndex, 0, removed);
          return newRankings;
        });

        // Trigger refinement battles
        onManualReorder(active.id as number, oldIndex, newIndex);
      }
    }
  }, [displayRankings, onManualReorder, onLocalReorder]);

  return {
    sensors,
    handleDragEnd
  };
};
