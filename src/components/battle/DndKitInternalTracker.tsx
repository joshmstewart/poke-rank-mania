
import React, { useEffect, useRef } from 'react';
import { useDndContext } from '@dnd-kit/core';

// Component to track @dnd-kit's internal context state changes
const DndKitInternalTracker: React.FC = () => {
  const dndContext = useDndContext();
  const prevContextRef = useRef(dndContext);
  
  // CRITICAL: Track all properties of DndContext to see what's changing
  useEffect(() => {
    const prev = prevContextRef.current;
    const current = dndContext;
    
    console.log(`🔍 [DND_INTERNAL_TRACKER] ===== DndContext state change detected =====`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - active changed: ${prev.active?.id !== current.active?.id} (${prev.active?.id || 'null'} → ${current.active?.id || 'null'})`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - over changed: ${prev.over?.id !== current.over?.id} (${prev.over?.id || 'null'} → ${current.over?.id || 'null'})`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - activatorEvent changed: ${prev.activatorEvent !== current.activatorEvent}`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - collisions changed: ${prev.collisions !== current.collisions} (${prev.collisions?.length || 0} → ${current.collisions?.length || 0} items)`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - dragOverlay changed: ${prev.dragOverlay !== current.dragOverlay}`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - droppableContainers changed: ${prev.droppableContainers !== current.droppableContainers}`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - draggableNodes changed: ${prev.draggableNodes !== current.draggableNodes}`);
    
    // Log the specific container and node counts
    const droppableCount = current.droppableContainers ? Object.keys(current.droppableContainers).length : 0;
    const draggableCount = current.draggableNodes ? Object.keys(current.draggableNodes).length : 0;
    console.log(`🔍 [DND_INTERNAL_TRACKER] - Current state: ${droppableCount} droppable containers, ${draggableCount} draggable nodes`);
    
    console.log(`🔍 [DND_INTERNAL_TRACKER] ===== End DndContext change =====`);
    
    prevContextRef.current = current;
  }, [
    dndContext.active,
    dndContext.over,
    dndContext.activatorEvent,
    dndContext.collisions,
    dndContext.dragOverlay,
    dndContext.droppableContainers,
    dndContext.draggableNodes
  ]);

  return null; // This component is only for debugging
};

export default DndKitInternalTracker;
