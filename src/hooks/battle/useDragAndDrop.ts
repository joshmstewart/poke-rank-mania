
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

    console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== DRAG OPERATION START =====`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Active ID: ${active.id} (type: ${typeof active.id})`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Over ID: ${over?.id || 'none'} (type: ${typeof over?.id})`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Display rankings length: ${displayRankings.length}`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] onManualReorder function:`, typeof onManualReorder, !!onManualReorder);

    if (over && active.id !== over.id) {
      const oldIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
      const newIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);

      console.log(`🎯 [DRAG_ULTRA_DEBUG] Old index: ${oldIndex}`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] New index: ${newIndex}`);

      if (oldIndex !== -1 && newIndex !== -1) {
        const draggedPokemon = displayRankings[oldIndex];
        console.log(`🎯 [DRAG_ULTRA_DEBUG] Dragged Pokemon: ${draggedPokemon.name} (ID: ${draggedPokemon.id}, type: ${typeof draggedPokemon.id})`);
        
        // Update local rankings immediately for visual feedback
        onLocalReorder(current => {
          const newRankings = [...current];
          const [removed] = newRankings.splice(oldIndex, 1);
          newRankings.splice(newIndex, 0, removed);
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
      } else {
        console.error(`🎯 [DRAG_ULTRA_DEBUG] ❌ Invalid indices - oldIndex: ${oldIndex}, newIndex: ${newIndex}`);
      }
    } else {
      console.log(`🎯 [DRAG_ULTRA_DEBUG] ❌ Drag cancelled or same position`);
    }
    
    console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== DRAG OPERATION END =====`);
  }, [displayRankings, onManualReorder, onLocalReorder]);

  return {
    sensors,
    handleDragEnd
  };
};
