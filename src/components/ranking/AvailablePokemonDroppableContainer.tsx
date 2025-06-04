
import React, { useEffect } from "react";
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

  // CRITICAL: Enhanced droppable initialization logging
  useEffect(() => {
    console.log(`[DROPPABLE_INIT] Initialized droppable with ID: available-pokemon-drop-zone`);
    console.log(`[DROPPABLE_INIT] setNodeRef function exists: ${!!setNodeRef}`);
  }, [setNodeRef]);

  // Additional logging when hover state changes
  useEffect(() => {
    if (isOver) {
      console.log(`[DROPPABLE_HOVER] Available drop zone is being hovered over!`);
    }
  }, [isOver]);

  console.log(`[AVAILABLE_DROPPABLE] Available drop zone render - isOver: ${isOver}`);

  return (
    <div 
      ref={setNodeRef} 
      className={`h-full w-full flex flex-col transition-colors available-drop-zone ${
        isOver ? 'bg-green-50 border-2 border-green-300' : ''
      }`}
      style={{
        minHeight: '200px',
        position: 'relative'
      }}
    >
      {children}
    </div>
  );
};
