
import React, { useEffect } from "react";
import { useDroppable } from '@dnd-kit/core';

interface RankingsDroppableContainerProps {
  children: React.ReactNode;
}

export const RankingsDroppableContainer: React.FC<RankingsDroppableContainerProps> = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'rankings-drop-zone',
    data: {
      type: 'rankings-container',
      accepts: ['available-pokemon', 'ranked-pokemon'],
      source: 'rankings-droppable'
    },
  });

  // CRITICAL: Add droppable initialization logging
  useEffect(() => {
    console.log(`🎯🎯🎯 [DROPPABLE_INIT] Rankings drop zone initialized with ID: rankings-drop-zone`);
    console.log(`🎯🎯🎯 [DROPPABLE_INIT] setNodeRef function:`, !!setNodeRef);
  }, [setNodeRef]);

  // Additional logging when hover state changes
  useEffect(() => {
    if (isOver) {
      console.log(`🎯🎯🎯 [DROPPABLE_HOVER] Rankings drop zone is being hovered over!`);
    }
  }, [isOver]);

  console.log(`🎯 [DROPPABLE_CONTAINER] Rankings drop zone render - isOver: ${isOver}`);

  return (
    <div 
      ref={setNodeRef} 
      className={`h-full w-full flex flex-col transition-colors rankings-drop-zone ${
        isOver ? 'bg-blue-50 border-2 border-blue-300' : ''
      }`}
      style={{
        minHeight: '200px', // Ensure minimum height for drop zone
        position: 'relative' // Ensure proper positioning
      }}
    >
      {children}
    </div>
  );
};
