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
import { useSharedRefinementQueue } from './useSharedRefinementQueue';

interface UseDragAndDropProps {
  displayRankings: any[];
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: any[]) => void;
}

export const useDragAndDrop = ({ displayRankings, onManualReorder, onLocalReorder }: UseDragAndDropProps) => {
  console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ===== useDragAndDrop INITIALIZATION =====`);
  
  const refinementQueue = useSharedRefinementQueue();
  
  console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Refinement queue in useDragAndDrop:`, {
    exists: !!refinementQueue,
    hasRefinementBattles: refinementQueue?.hasRefinementBattles,
    refinementBattleCount: refinementQueue?.refinementBattleCount,
    queueLength: refinementQueue?.queue?.length || 0
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ===== DRAG END START =====`);
    console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Event:`, event);
    
    const { active, over } = event;

    if (!over || active.id === over.id) {
      console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ❌ No drop target or same position - exiting`);
      return;
    }

    const activeIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
    const overIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);
    
    console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Drag details:`);
    console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] - Active Pokemon ID: ${active.id}`);
    console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] - Over Pokemon ID: ${over.id}`);
    console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] - Active Index: ${activeIndex}`);
    console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] - Over Index: ${overIndex}`);

    if (activeIndex === -1 || overIndex === -1) {
      console.error(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ❌ Invalid indices - activeIndex: ${activeIndex}, overIndex: ${overIndex}`);
      return;
    }

    const draggedPokemon = displayRankings[activeIndex];
    console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Dragged Pokemon: ${draggedPokemon.name} (${draggedPokemon.id})`);

    // Update local rankings for immediate UI feedback
    if (onLocalReorder) {
      console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Calling onLocalReorder...`);
      const newRankings = arrayMove(displayRankings, activeIndex, overIndex);
      onLocalReorder(newRankings);
    }

    // CRITICAL: Add refinement battles to queue
    if (refinementQueue && refinementQueue.queueBattlesForReorder) {
      console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ===== QUEUEING REFINEMENT BATTLES =====`);
      
      // Get neighbors around the new position
      const neighbors: number[] = [];
      if (overIndex > 0) {
        neighbors.push(displayRankings[overIndex - 1].id);
        console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Added neighbor above: ${displayRankings[overIndex - 1].name} (${displayRankings[overIndex - 1].id})`);
      }
      if (overIndex < displayRankings.length - 1) {
        neighbors.push(displayRankings[overIndex + 1].id);
        console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Added neighbor below: ${displayRankings[overIndex + 1].name} (${displayRankings[overIndex + 1].id})`);
      }
      
      console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] All neighbors for validation: ${neighbors}`);
      console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] About to call queueBattlesForReorder...`);
      
      try {
        refinementQueue.queueBattlesForReorder(draggedPokemon.id, neighbors, overIndex);
        console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ✅ queueBattlesForReorder called successfully`);
        
        // Check queue state after adding
        console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Queue state after adding:`);
        console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] - hasRefinementBattles: ${refinementQueue.hasRefinementBattles}`);
        console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] - refinementBattleCount: ${refinementQueue.refinementBattleCount}`);
        console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] - queue contents: ${JSON.stringify(refinementQueue.queue || refinementQueue.refinementQueue)}`);
        
      } catch (error) {
        console.error(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ❌ Error calling queueBattlesForReorder:`, error);
      }
      
      // Dispatch events to notify other components
      const refinementEvent = new CustomEvent('refinement-queue-updated', {
        detail: { pokemonId: draggedPokemon.id, neighbors, newPosition: overIndex }
      });
      document.dispatchEvent(refinementEvent);
      
      console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Dispatching force-next-battle event...`);
      const forceEvent = new CustomEvent('force-next-battle', {
        detail: { 
          pokemonId: draggedPokemon.id, 
          pokemonName: draggedPokemon.name,
          source: 'drag-drop',
          timestamp: new Date().toISOString()
        }
      });
      document.dispatchEvent(forceEvent);
      console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ✅ force-next-battle event dispatched`);
      
    } else {
      console.error(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ❌ NO REFINEMENT QUEUE OR queueBattlesForReorder METHOD!`);
      console.error(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] refinementQueue:`, refinementQueue);
      console.error(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] queueBattlesForReorder:`, refinementQueue?.queueBattlesForReorder);
    }

    // Call the manual reorder callback
    if (onManualReorder) {
      console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] Calling onManualReorder...`);
      onManualReorder(draggedPokemon.id, activeIndex, overIndex);
    }
    
    console.log(`🚨🚨🚨 [DRAG_DROP_ULTRA_TRACE] ===== DRAG END COMPLETE =====`);
  };

  return { sensors, handleDragEnd };
};
