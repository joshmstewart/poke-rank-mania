
import { useState, useCallback, useRef } from 'react';

export const useDragState = () => {
  // Use refs for values that don't need to trigger re-renders
  const isDraggingRef = useRef(false);
  const draggedPokemonIdRef = useRef<number | null>(null);
  const isUpdatingRef = useRef(false);
  
  // Only use state for values that need to trigger re-renders
  const [renderTrigger, setRenderTrigger] = useState(0);

  const handleDragStart = useCallback((event: any) => {
    const draggedId = parseInt(event.active.id);
    isDraggingRef.current = true;
    draggedPokemonIdRef.current = draggedId;
    setRenderTrigger(prev => prev + 1); // Trigger re-render
    console.log('🎯 [DRAG_STATE] Drag started for Pokemon ID:', draggedId);
  }, []);

  const clearDragState = useCallback(() => {
    isDraggingRef.current = false;
    draggedPokemonIdRef.current = null;
    setRenderTrigger(prev => prev + 1); // Trigger re-render
  }, []);

  const setUpdatingState = useCallback((updating: boolean) => {
    isUpdatingRef.current = updating;
    setRenderTrigger(prev => prev + 1); // Trigger re-render
  }, []);

  return {
    isDragging: isDraggingRef.current,
    draggedPokemonId: draggedPokemonIdRef.current,
    isUpdating: isUpdatingRef.current,
    handleDragStart,
    clearDragState,
    setUpdatingState
  };
};
