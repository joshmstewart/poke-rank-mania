
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
  console.log(`🚨 [DRAG_HOOK_DEBUG] ===== useDragAndDrop hook initialization =====`);
  console.log(`🚨 [DRAG_HOOK_DEBUG] PointerSensor imported:`, typeof PointerSensor);
  console.log(`🚨 [DRAG_HOOK_DEBUG] KeyboardSensor imported:`, typeof KeyboardSensor);
  console.log(`🚨 [DRAG_HOOK_DEBUG] useSensors imported:`, typeof useSensors);
  console.log(`🚨 [DRAG_HOOK_DEBUG] displayRankings count:`, displayRankings.length);
  console.log(`🚨 [DRAG_HOOK_DEBUG] onManualReorder type:`, typeof onManualReorder);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0, // Immediate activation - no distance threshold
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  console.log(`🚨 [DRAG_HOOK_DEBUG] Sensors created:`, sensors?.length);
  console.log(`🚨 [DRAG_HOOK_DEBUG] First sensor type:`, sensors?.[0]?.constructor?.name);
  console.log(`🚨 [DRAG_HOOK_DEBUG] Sensor configurations:`, sensors?.map(s => ({
    name: s.constructor?.name,
    hasOptions: !!s
  })));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🚨 [DRAG_HOOK_DEBUG] ===== DRAG END EVENT TRIGGERED =====`);
    console.log(`🚨 [DRAG_HOOK_DEBUG] ✅ SUCCESS! @dnd-kit drag and drop is working!`);
    console.log(`🚨 [DRAG_HOOK_DEBUG] Event object:`, event);
    console.log(`🚨 [DRAG_HOOK_DEBUG] Active ID:`, event.active.id);
    console.log(`🚨 [DRAG_HOOK_DEBUG] Over ID:`, event.over?.id);

    const { active, over } = event;

    if (!over) {
      console.log(`🚨 [DRAG_HOOK_DEBUG] ❌ No drop target - drag cancelled`);
      return;
    }

    if (active.id === over.id) {
      console.log(`🚨 [DRAG_HOOK_DEBUG] ❌ Same position drop - no change needed`);
      return;
    }

    const oldIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
    const newIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);

    console.log(`🚨 [DRAG_HOOK_DEBUG] Old index:`, oldIndex);
    console.log(`🚨 [DRAG_HOOK_DEBUG] New index:`, newIndex);
    console.log(`🚨 [DRAG_HOOK_DEBUG] displayRankings IDs:`, displayRankings.map(p => p.id));

    if (oldIndex === -1 || newIndex === -1) {
      console.error(`🚨 [DRAG_HOOK_DEBUG] ❌ Invalid indices - oldIndex: ${oldIndex}, newIndex: ${newIndex}`);
      return;
    }

    const draggedPokemon = displayRankings[oldIndex];
    console.log(`🚨 [DRAG_HOOK_DEBUG] ✅ Dragged Pokemon:`, draggedPokemon.name, `(ID: ${draggedPokemon.id})`);

    // Update local rankings immediately for UI feedback
    console.log(`🚨 [DRAG_HOOK_DEBUG] Updating local rankings...`);
    onLocalReorder(current => {
      const newRankings = [...current];
      const [removed] = newRankings.splice(oldIndex, 1);
      newRankings.splice(newIndex, 0, removed);
      console.log(`🚨 [DRAG_HOOK_DEBUG] ✅ Local rankings updated`);
      return newRankings;
    });

    // Convert ID to number if needed
    let pokemonId: number;
    if (typeof active.id === 'string') {
      pokemonId = parseInt(active.id, 10);
    } else {
      pokemonId = active.id as number;
    }

    console.log(`🚨 [DRAG_HOOK_DEBUG] ✅ About to call onManualReorder:`, {
      pokemonId,
      oldIndex,
      newIndex,
      pokemonName: draggedPokemon.name
    });

    if (typeof onManualReorder === 'function') {
      console.log(`🚨 [DRAG_HOOK_DEBUG] ✅ Calling onManualReorder function...`);
      onManualReorder(pokemonId, oldIndex, newIndex);
      console.log(`🚨 [DRAG_HOOK_DEBUG] ✅ onManualReorder called successfully`);
    } else {
      console.error(`🚨 [DRAG_HOOK_DEBUG] ❌ onManualReorder is not a function:`, typeof onManualReorder);
    }
  }, [displayRankings, onManualReorder, onLocalReorder]);

  console.log(`🚨 [DRAG_HOOK_DEBUG] handleDragEnd created:`, typeof handleDragEnd);

  return {
    sensors,
    handleDragEnd
  };
};
