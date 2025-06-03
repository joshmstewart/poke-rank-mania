
import { useState, useCallback } from 'react';

export const useDragState = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPokemonId, setDraggedPokemonId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragStart = useCallback((event: any) => {
    const draggedId = parseInt(event.active.id);
    setIsDragging(true);
    setDraggedPokemonId(draggedId);
    console.log('🎯 [DRAG_STATE] Drag started for Pokemon ID:', draggedId);
  }, []);

  const clearDragState = useCallback(() => {
    setIsDragging(false);
    setDraggedPokemonId(null);
  }, []);

  const setUpdatingState = useCallback((updating: boolean) => {
    setIsUpdating(updating);
  }, []);

  return {
    isDragging,
    draggedPokemonId,
    isUpdating,
    handleDragStart,
    clearDragState,
    setUpdatingState
  };
};
