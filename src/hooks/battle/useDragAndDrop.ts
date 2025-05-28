
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
  console.log(`🎯 [DRAG_SETUP_DEBUG] useDragAndDrop hook initialized`);
  console.log(`🎯 [DRAG_SETUP_DEBUG] displayRankings count:`, displayRankings.length);
  console.log(`🎯 [DRAG_SETUP_DEBUG] onManualReorder function type:`, typeof onManualReorder);
  console.log(`🎯 [DRAG_SETUP_DEBUG] onManualReorder exists:`, !!onManualReorder);

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

  console.log(`🎯 [DRAG_SETUP_DEBUG] Sensors configured:`, sensors.length);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🎯 [DRAG_END_ENTRY] ===== DRAG END EVENT TRIGGERED =====`);
    console.log(`🎯 [DRAG_END_ENTRY] Event object:`, event);
    console.log(`🎯 [DRAG_END_ENTRY] Event type:`, typeof event);
    console.log(`🎯 [DRAG_END_ENTRY] Event active:`, event.active);
    console.log(`🎯 [DRAG_END_ENTRY] Event over:`, event.over);

    const { active, over } = event;

    console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== DRAG OPERATION START =====`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Active ID: ${active.id} (type: ${typeof active.id})`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Over ID: ${over?.id || 'none'} (type: ${typeof over?.id})`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Display rankings length: ${displayRankings.length}`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] onManualReorder function:`, typeof onManualReorder, !!onManualReorder);

    if (!over) {
      console.log(`🎯 [DRAG_ULTRA_DEBUG] ❌ No drop target (over is null/undefined)`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== DRAG OPERATION END (NO TARGET) =====`);
      return;
    }

    if (active.id === over.id) {
      console.log(`🎯 [DRAG_ULTRA_DEBUG] ❌ Same position drop (active.id === over.id)`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== DRAG OPERATION END (SAME POSITION) =====`);
      return;
    }

    console.log(`🎯 [DRAG_ULTRA_DEBUG] ✅ Valid drag operation - proceeding with reorder`);

    const oldIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
    const newIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);

    console.log(`🎯 [DRAG_ULTRA_DEBUG] Old index: ${oldIndex}`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] New index: ${newIndex}`);

    if (oldIndex === -1) {
      console.error(`🎯 [DRAG_ULTRA_DEBUG] ❌ Could not find active Pokemon in rankings (ID: ${active.id})`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] Available Pokemon IDs:`, displayRankings.map(p => p.id));
      return;
    }

    if (newIndex === -1) {
      console.error(`🎯 [DRAG_ULTRA_DEBUG] ❌ Could not find target Pokemon in rankings (ID: ${over.id})`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] Available Pokemon IDs:`, displayRankings.map(p => p.id));
      return;
    }

    const draggedPokemon = displayRankings[oldIndex];
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Dragged Pokemon: ${draggedPokemon.name} (ID: ${draggedPokemon.id}, type: ${typeof draggedPokemon.id})`);
    
    // Update local rankings immediately for visual feedback
    console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== UPDATING LOCAL RANKINGS =====`);
    onLocalReorder(current => {
      const newRankings = [...current];
      const [removed] = newRankings.splice(oldIndex, 1);
      newRankings.splice(newIndex, 0, removed);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] Local rankings updated successfully`);
      return newRankings;
    });

    // Convert active.id to number properly
    let pokemonId: number;
    if (typeof active.id === 'string') {
      pokemonId = parseInt(active.id, 10);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] Converted string ID "${active.id}" to number ${pokemonId}`);
    } else if (typeof active.id === 'number') {
      pokemonId = active.id;
      console.log(`🎯 [DRAG_ULTRA_DEBUG] Using number ID ${pokemonId}`);
    } else {
      console.error(`🎯 [DRAG_ULTRA_DEBUG] Invalid active.id type:`, typeof active.id, active.id);
      return;
    }

    if (isNaN(pokemonId)) {
      console.error(`🎯 [DRAG_ULTRA_DEBUG] Failed to convert ID to valid number:`, active.id);
      return;
    }

    console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== CALLING onManualReorder =====`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Parameters: pokemonId=${pokemonId}, oldIndex=${oldIndex}, newIndex=${newIndex}`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] onManualReorder function type:`, typeof onManualReorder);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] onManualReorder function exists:`, typeof onManualReorder === 'function');
    
    if (typeof onManualReorder === 'function') {
      try {
        console.log(`🎯 [DRAG_ULTRA_DEBUG] ✅ About to call onManualReorder...`);
        onManualReorder(pokemonId, oldIndex, newIndex);
        console.log(`🎯 [DRAG_ULTRA_DEBUG] ✅ onManualReorder called successfully`);
      } catch (error) {
        console.error(`🎯 [DRAG_ULTRA_DEBUG] ❌ Error calling onManualReorder:`, error);
      }
    } else {
      console.error(`🎯 [DRAG_ULTRA_DEBUG] ❌ onManualReorder is not a function:`, typeof onManualReorder);
    }
    
    console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== DRAG OPERATION END =====`);
  }, [displayRankings, onManualReorder, onLocalReorder]);

  console.log(`🎯 [DRAG_SETUP_DEBUG] handleDragEnd function created:`, typeof handleDragEnd);

  return {
    sensors,
    handleDragEnd
  };
};
