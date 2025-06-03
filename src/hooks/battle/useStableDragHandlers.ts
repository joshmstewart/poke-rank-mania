
import { useCallback, useRef } from 'react';

export const useStableDragHandlers = (
  onManualReorder: ((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void) | undefined,
  onLocalReorder: ((newRankings: any[]) => void) | undefined
) => {
  // Create stable refs to prevent handler recreation
  const onManualReorderRef = useRef(onManualReorder);
  const onLocalReorderRef = useRef(onLocalReorder);
  
  // Update refs when props change
  onManualReorderRef.current = onManualReorder;
  onLocalReorderRef.current = onLocalReorder;

  // Memoized stable handlers
  const stableOnManualReorder = useCallback((
    draggedPokemonId: number, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    if (onManualReorderRef.current) {
      onManualReorderRef.current(draggedPokemonId, sourceIndex, destinationIndex);
    }
  }, []); // Empty dependency array for complete stability

  const stableOnLocalReorder = useCallback((newRankings: any[]) => {
    if (onLocalReorderRef.current) {
      onLocalReorderRef.current(newRankings);
    }
  }, []); // Empty dependency array for complete stability

  return {
    stableOnManualReorder,
    stableOnLocalReorder
  };
};
