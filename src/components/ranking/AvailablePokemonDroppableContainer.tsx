
import React from "react";
import { useDroppable } from '@dnd-kit/core';

interface AvailablePokemonDroppableContainerProps {
  children: React.ReactNode;
}

export const AvailablePokemonDroppableContainer: React.FC<AvailablePokemonDroppableContainerProps> = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'available-pokemon-drop-zone',
    data: {
      type: 'available-container',
      accepts: ['ranked-pokemon', 'available-pokemon'],
      source: 'available-droppable'
    },
  });

  console.log(`🎯 [AVAILABLE_DROPPABLE] Available drop zone initialized with ID: available-pokemon-drop-zone`);
  console.log(`🎯 [AVAILABLE_DROPPABLE] Drop zone isOver: ${isOver}`);
  console.log(`🎯 [AVAILABLE_DROPPABLE] Accepts: ['ranked-pokemon', 'available-pokemon']`);

  return (
    <div 
      ref={setNodeRef} 
      className={`h-full w-full flex flex-col transition-colors available-drop-zone ${
        isOver ? 'bg-green-50' : ''
      }`}
    >
      {children}
    </div>
  );
};
