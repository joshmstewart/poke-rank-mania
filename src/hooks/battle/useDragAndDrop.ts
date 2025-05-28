
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
  console.log(`🚨 [DRAG_CRITICAL_DEBUG] ===== useDragAndDrop hook =====`);
  console.log(`🚨 [DRAG_CRITICAL_DEBUG] PointerSensor imported:`, typeof PointerSensor);
  console.log(`🚨 [DRAG_CRITICAL_DEBUG] KeyboardSensor imported:`, typeof KeyboardSensor);
  console.log(`🚨 [DRAG_CRITICAL_DEBUG] useSensors imported:`, typeof useSensors);
  console.log(`🚨 [DRAG_CRITICAL_DEBUG] displayRankings count:`, displayRankings.length);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0, // No distance required - immediate activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  console.log(`🚨 [DRAG_CRITICAL_DEBUG] Sensors created:`, sensors?.length);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🚨 [DRAG_CRITICAL_DEBUG] ===== DRAG END EVENT =====`);
    console.log(`🚨 [DRAG_CRITICAL_DEBUG] Event:`, event);
    console.log(`🚨 [DRAG_CRITICAL_DEBUG] Active ID:`, event.active.id);
    console.log(`🚨 [DRAG_CRITICAL_DEBUG] Over ID:`, event.over?.id);

    const { active, over } = event;

    if (!over) {
      console.log(`🚨 [DRAG_CRITICAL_DEBUG] No drop target`);
      return;
    }

    if (active.id === over.id) {
      console.log(`🚨 [DRAG_CRITICAL_DEBUG] Same position drop`);
      return;
    }

    const oldIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
    const newIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);

    console.log(`🚨 [DRAG_CRITICAL_DEBUG] Old index:`, oldIndex);
    console.log(`🚨 [DRAG_CRITICAL_DEBUG] New index:`, newIndex);

    if (oldIndex === -1 || newIndex === -1) {
      console.error(`🚨 [DRAG_CRITICAL_DEBUG] Invalid indices`);
      return;
    }

    const draggedPokemon = displayRankings[oldIndex];
    console.log(`🚨 [DRAG_CRITICAL_DEBUG] Dragged Pokemon:`, draggedPokemon.name);

    // Update local rankings immediately
    onLocalReorder(current => {
      const newRankings = [...current];
      const [removed] = newRankings.splice(oldIndex, 1);
      newRankings.splice(newIndex, 0, removed);
      console.log(`🚨 [DRAG_CRITICAL_DEBUG] Local rankings updated`);
      return newRankings;
    });

    // Convert ID to number if needed
    let pokemonId: number;
    if (typeof active.id === 'string') {
      pokemonId = parseInt(active.id, 10);
    } else {
      pokemonId = active.id as number;
    }

    console.log(`🚨 [DRAG_CRITICAL_DEBUG] Calling onManualReorder:`, pokemonId, oldIndex, newIndex);
    if (typeof onManualReorder === 'function') {
      onManualReorder(pokemonId, oldIndex, newIndex);
    }
  }, [displayRankings, onManualReorder, onLocalReorder]);

  console.log(`🚨 [DRAG_CRITICAL_DEBUG] handleDragEnd created:`, typeof handleDragEnd);

  return {
    sensors,
    handleDragEnd
  };
};
