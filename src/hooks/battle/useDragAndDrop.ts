
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
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Active ID: ${active.id}`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Over ID: ${over?.id || 'none'}`);
    console.log(`🎯 [DRAG_ULTRA_DEBUG] Display rankings length: ${displayRankings.length}`);

    if (over && active.id !== over.id) {
      const oldIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
      const newIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);

      console.log(`🎯 [DRAG_ULTRA_DEBUG] Old index: ${oldIndex}`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] New index: ${newIndex}`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] Old index valid: ${oldIndex !== -1}`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] New index valid: ${newIndex !== -1}`);

      if (oldIndex !== -1 && newIndex !== -1) {
        const draggedPokemon = displayRankings[oldIndex];
        console.log(`🎯 [DRAG_ULTRA_DEBUG] Dragged Pokemon: ${draggedPokemon.name} (ID: ${draggedPokemon.id})`);
        console.log(`🎯 [DRAG_ULTRA_DEBUG] Moving from position ${oldIndex + 1} to ${newIndex + 1}`);
        
        // Update local rankings immediately for visual feedback
        console.log(`🎯 [DRAG_ULTRA_DEBUG] Updating local rankings for visual feedback...`);
        onLocalReorder(current => {
          const newRankings = [...current];
          const [removed] = newRankings.splice(oldIndex, 1);
          newRankings.splice(newIndex, 0, removed);
          console.log(`🎯 [DRAG_ULTRA_DEBUG] Local reorder complete`);
          return newRankings;
        });

        // CRITICAL: This should trigger refinement battles
        console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== CALLING onManualReorder =====`);
        console.log(`🎯 [DRAG_ULTRA_DEBUG] Parameters: Pokemon ID ${active.id}, oldIndex ${oldIndex}, newIndex ${newIndex}`);
        console.log(`🎯 [DRAG_ULTRA_DEBUG] onManualReorder function exists: ${typeof onManualReorder === 'function'}`);
        
        try {
          onManualReorder(active.id as number, oldIndex, newIndex);
          console.log(`🎯 [DRAG_ULTRA_DEBUG] ✅ onManualReorder called successfully`);
        } catch (error) {
          console.error(`🎯 [DRAG_ULTRA_DEBUG] ❌ Error calling onManualReorder:`, error);
        }
        
        console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== END CALLING onManualReorder =====`);
      } else {
        console.error(`🎯 [DRAG_ULTRA_DEBUG] ❌ Invalid indices - oldIndex: ${oldIndex}, newIndex: ${newIndex}`);
      }
    } else {
      console.log(`🎯 [DRAG_ULTRA_DEBUG] ❌ Drag cancelled or same position`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] Over exists: ${!!over}`);
      console.log(`🎯 [DRAG_ULTRA_DEBUG] IDs different: ${active.id !== over?.id}`);
    }
    
    console.log(`🎯 [DRAG_ULTRA_DEBUG] ===== DRAG OPERATION END =====`);
  }, [displayRankings, onManualReorder, onLocalReorder]);

  return {
    sensors,
    handleDragEnd
  };
};
