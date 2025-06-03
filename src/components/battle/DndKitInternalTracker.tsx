
import React, { useEffect, useRef } from 'react';
import { useDndContext } from '@dnd-kit/core';

// Component to track @dnd-kit's internal context state changes with REDUCED logging
const DndKitInternalTracker: React.FC = () => {
  const dndContext = useDndContext();
  const prevContextRef = useRef(dndContext);
  
  // REDUCED: Only track critical properties and log significant changes
  useEffect(() => {
    const prev = prevContextRef.current;
    const current = dndContext;
    
    // Only log when drag starts or ends (significant state changes)
    const dragStarted = !prev.active && current.active;
    const dragEnded = prev.active && !current.active;
    
    if (dragStarted || dragEnded) {
      console.log(`🔍 [DND_INTERNAL_TRACKER] ===== DndContext ${dragStarted ? 'DRAG START' : 'DRAG END'} =====`);
      console.log(`🔍 [DND_INTERNAL_TRACKER] - active: ${current.active?.id || 'null'}`);
      console.log(`🔍 [DND_INTERNAL_TRACKER] - over: ${current.over?.id || 'null'}`);
      
      const droppableCount = current.droppableContainers ? Object.keys(current.droppableContainers).length : 0;
      const draggableCount = current.draggableNodes ? Object.keys(current.draggableNodes).length : 0;
      console.log(`🔍 [DND_INTERNAL_TRACKER] - Containers: ${droppableCount} droppable, ${draggableCount} draggable`);
      console.log(`🔍 [DND_INTERNAL_TRACKER] ===== End DndContext change =====`);
    }
    
    prevContextRef.current = current;
  }, [
    dndContext.active,
    dndContext.over
  ]);

  return null; // This component is only for debugging
};

export default DndKitInternalTracker;
