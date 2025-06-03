
import { useCallback, useRef } from 'react';

export const useStableDragHandlers = (
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void,
  onLocalReorder?: (newRankings: any[]) => void
) => {
  // Use refs to maintain stable function references
  const onManualReorderRef = useRef(onManualReorder);
  const onLocalReorderRef = useRef(onLocalReorder);
  
  // Update refs when props change
  onManualReorderRef.current = onManualReorder;
  onLocalReorderRef.current = onLocalReorder;

  // Create stable callback functions that won't cause re-renders
  const stableOnManualReorder = useCallback((
    draggedPokemonId: number, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    if (onManualReorderRef.current) {
      onManualReorderRef.current(draggedPokemonId, sourceIndex, destinationIndex);
    }
  }, []); // Empty deps array for maximum stability

  const stableOnLocalReorder = useCallback((newRankings: any[]) => {
    if (onLocalReorderRef.current) {
      onLocalReorderRef.current(newRankings);
    }
  }, []); // Empty deps array for maximum stability

  return {
    stableOnManualReorder,
    stableOnLocalReorder
  };
};
