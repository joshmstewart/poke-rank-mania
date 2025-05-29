
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
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] ===== DRAG END EVENT TRIGGERED =====`);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] ✅ SUCCESS! @dnd-kit drag and drop is working!`);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] Event object:`, event);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] Active ID:`, event.active.id);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] Over ID:`, event.over?.id);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] Active data:`, event.active.data);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] Over data:`, event.over?.data);

    const { active, over } = event;

    if (!over) {
      console.log(`🚨 [DRAG_END_MEGA_DEBUG] ❌ No drop target - drag cancelled`);
      return;
    }

    if (active.id === over.id) {
      console.log(`🚨 [DRAG_END_MEGA_DEBUG] ❌ Same position drop - no change needed`);
      return;
    }

    const oldIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
    const newIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);

    console.log(`🚨 [DRAG_END_MEGA_DEBUG] Old index:`, oldIndex);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] New index:`, newIndex);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] displayRankings IDs:`, displayRankings.map(p => p.id));
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] displayRankings length:`, displayRankings.length);

    if (oldIndex === -1 || newIndex === -1) {
      console.error(`🚨 [DRAG_END_MEGA_DEBUG] ❌ Invalid indices - oldIndex: ${oldIndex}, newIndex: ${newIndex}`);
      console.error(`🚨 [DRAG_END_MEGA_DEBUG] Active ID type:`, typeof active.id);
      console.error(`🚨 [DRAG_END_MEGA_DEBUG] Over ID type:`, typeof over.id);
      console.error(`🚨 [DRAG_END_MEGA_DEBUG] Available Pokemon IDs:`, displayRankings.map(p => ({ id: p.id, type: typeof p.id })));
      return;
    }

    const draggedPokemon = displayRankings[oldIndex];
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] ✅ Dragged Pokemon:`, draggedPokemon.name, `(ID: ${draggedPokemon.id})`);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] ✅ Target Pokemon:`, displayRankings[newIndex].name, `(ID: ${displayRankings[newIndex].id})`);

    // Update local rankings immediately for UI feedback
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] About to update local rankings...`);
    console.log(`🚨 [DRAG_END_MEGA_DEBUG] onLocalReorder function type:`, typeof onLocalReorder);
    
    if (typeof onLocalReorder === 'function') {
      console.log(`🚨 [DRAG_END_MEGA_DEBUG] ✅ Calling onLocalReorder...`);
      onLocalReorder(current => {
        console.log(`🚨 [DRAG_END_MEGA_DEBUG] Inside onLocalReorder callback`);
        console.log(`🚨 [DRAG_END_MEGA_DEBUG] Current array length:`, current.length);
        const newRankings = [...current];
        const [removed] = newRankings.splice(oldIndex, 1);
        newRankings.splice(newIndex, 0, removed);
        console.log(`🚨 [DRAG_END_MEGA_DEBUG] ✅ Local rankings updated - moved ${removed.name} from ${oldIndex} to ${newIndex}`);
        return newRankings;
      });
      console.log(`🚨 [DRAG_END_MEGA_DEBUG] ✅ onLocalReorder completed`);
    } else {
      console.error(`🚨 [DRAG_END_MEGA_DEBUG] ❌ onLocalReorder is not a function:`, typeof onLocalReorder);
    }

    // Convert ID to number if needed
    let pokemonId: number;
    if (typeof active.id === 'string') {
      pokemonId = parseInt(active.id, 10);
      console.log(`🚨 [DRAG_END_MEGA_DEBUG] Converted string ID "${active.id}" to number ${pokemonId}`);
    } else {
      pokemonId = active.id as number;
      console.log(`🚨 [DRAG_END_MEGA_DEBUG] Using numeric ID:`, pokemonId);
    }

    console.log(`🚨 [DRAG_END_MEGA_DEBUG] ✅ About to call onManualReorder:`, {
      pokemonId,
      oldIndex,
      newIndex,
      pokemonName: draggedPokemon.name
    });

    if (typeof onManualReorder === 'function') {
      console.log(`🚨 [DRAG_END_MEGA_DEBUG] ✅ Calling onManualReorder function...`);
      console.log(`🚨 [DRAG_END_MEGA_DEBUG] Parameters: pokemonId=${pokemonId}, sourceIndex=${oldIndex}, destinationIndex=${newIndex}`);
      
      try {
        onManualReorder(pokemonId, oldIndex, newIndex);
        console.log(`🚨 [DRAG_END_MEGA_DEBUG] ✅ onManualReorder called successfully!`);
        console.log(`🚨 [DRAG_END_MEGA_DEBUG] This should have triggered the refinement queue...`);
      } catch (error) {
        console.error(`🚨 [DRAG_END_MEGA_DEBUG] ❌ Error calling onManualReorder:`, error);
        console.error(`🚨 [DRAG_END_MEGA_DEBUG] Error details:`, {
          message: error.message,
          stack: error.stack
        });
      }
    } else {
      console.error(`🚨 [DRAG_END_MEGA_DEBUG] ❌ onManualReorder is not a function:`, typeof onManualReorder);
    }

    console.log(`🚨 [DRAG_END_MEGA_DEBUG] ===== DRAG END PROCESSING COMPLETE =====`);
  }, [displayRankings, onManualReorder, onLocalReorder]);

  console.log(`🚨 [DRAG_HOOK_DEBUG] handleDragEnd created:`, typeof handleDragEnd);

  return {
    sensors,
    handleDragEnd
  };
};
