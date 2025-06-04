
import React from "react";

interface AvailablePokemonDroppableContainerProps {
  children: React.ReactNode;
}

// CRITICAL FIX: Remove any droppable logic from the available Pokemon container
// Available Pokemon should only be draggable, not droppable
export const AvailablePokemonDroppableContainer: React.FC<AvailablePokemonDroppableContainerProps> = ({ 
  children 
}) => {
  console.log(`🔍 [AVAILABLE_DROPPABLE] Rendering container WITHOUT droppable logic`);
  
  // CRITICAL FIX: Just render children without any droppable wrapper
  // This prevents the available section from highlighting as a drop zone
  return (
    <div className="h-full">
      {children}
    </div>
  );
};
