
import React from "react";
import { useDroppable } from '@dnd-kit/core';

interface RankingsDroppableContainerProps {
  children: React.ReactNode;
}

export const RankingsDroppableContainer: React.FC<RankingsDroppableContainerProps> = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'rankings-drop-zone',
    data: {
      type: 'rankings-container',
      accepts: ['available-pokemon'],
      source: 'rankings-droppable'
    },
  });

  console.log(`🎯 [DROPPABLE_CONTAINER] Rankings drop zone initialized with ID: rankings-drop-zone`);
  console.log(`🎯 [DROPPABLE_CONTAINER] Drop zone isOver: ${isOver}`);

  return (
    <div 
      ref={setNodeRef} 
      className={`h-full w-full flex flex-col transition-colors ${
        isOver ? 'bg-blue-50' : ''
      }`}
    >
      {children}
    </div>
  );
};
