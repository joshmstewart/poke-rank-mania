
import React, { useEffect, useContext } from 'react';
import { useDndContext } from '@dnd-kit/core';

// Component to track @dnd-kit's internal context state changes
const DndKitInternalTracker: React.FC = () => {
  const dndContext = useDndContext();
  
  // CRITICAL: Track all properties of DndContext to see what's changing
  useEffect(() => {
    console.log(`🔍 [DND_INTERNAL_TRACKER] DndContext state changed:`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - active: ${dndContext.active ? dndContext.active.id : 'null'}`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - over: ${dndContext.over ? dndContext.over.id : 'null'}`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - activatorEvent: ${dndContext.activatorEvent ? 'present' : 'null'}`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - collisions: ${dndContext.collisions ? dndContext.collisions.length : 0} items`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - dragOverlay: ${dndContext.dragOverlay ? 'present' : 'null'}`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - droppableContainers: ${dndContext.droppableContainers ? Object.keys(dndContext.droppableContainers).length : 0} containers`);
    console.log(`🔍 [DND_INTERNAL_TRACKER] - draggableNodes: ${dndContext.draggableNodes ? Object.keys(dndContext.draggableNodes).length : 0} nodes`);
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
