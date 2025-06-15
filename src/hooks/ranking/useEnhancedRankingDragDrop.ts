import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent, useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { usePokemonMovement } from './usePokemonMovement';

export const useEnhancedRankingDragDrop = (
  enhancedAvailablePokemon: any[],
  localRankings: any[],
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  handleEnhancedManualReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void,
  triggerReRanking: (pokemonId: number) => Promise<void>,
  updateLocalRankings: (rankings: any[]) => void
) => {
  const [dragState, setDragState] = useState<{
    activePokemon: any;
    sourceInfo: { fromAvailable: boolean; isRanked: boolean } | null;
    cardProps: any;
  }>({
    activePokemon: null,
    sourceInfo: null,
    cardProps: null,
  });

  // Use the atomic Pokemon movement hook
  const { moveFromAvailableToRankings } = usePokemonMovement(
    setAvailablePokemon,
    handleEnhancedManualReorder
  );

  // Optimized sensors for maximum responsiveness
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
        delay: 0,
        tolerance: 2,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 20,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    let sourceInfo = { fromAvailable: false, isRanked: false };
    let cardProps = null;

    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
      sourceInfo = { fromAvailable: true, isRanked: draggedPokemon?.isRanked || false };

      const index = enhancedAvailablePokemon.findIndex(p => p.id === pokemonId);
      cardProps = {
        pokemon: draggedPokemon,
        index: index,
        isPending: false,
        showRank: false,
        isDraggable: true,
        isAvailable: true,
        context: "available" as const
      };
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      sourceInfo = { fromAvailable: false, isRanked: true };

      const index = localRankings.findIndex(p => p.id === pokemonId);
      cardProps = {
        pokemon: draggedPokemon,
        index: index,
        isPending: false,
        showRank: true,
        isDraggable: true,
        isAvailable: false,
        context: "ranked" as const
      };
    }

    setDragState({
      activePokemon: draggedPokemon,
      sourceInfo: sourceInfo,
      cardProps: cardProps,
    });
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setDragState({ activePokemon: null, sourceInfo: null, cardProps: null });
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // === DROPPING A RANKED CARD (reorder) ===
    if (!activeId.startsWith('available-') && !overId.startsWith('available-') && !overId.startsWith('collision-placeholder-')) {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);

      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // 1. Move in local array for UI
        const newOrder = arrayMove(localRankings, oldIndex, newIndex);
        updateLocalRankings(newOrder);

        // 2. Immediately recalculate score + update store
        handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
      }
      return;
    }

    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      // Accept ANY OVER TARGET that is on the rankings-grid, rankings-drop-zone, or rankings container (let's improve this logic)
      const overIsRankingZone = (
        overId === 'rankings-drop-zone' ||
        overId === 'rankings-grid-drop-zone' ||
        over.data?.current?.type === 'rankings-container' ||
        over.data?.current?.type === 'rankings-grid'
      );
      let insertionPosition = localRankings.length;
      if (overIsRankingZone && localRankings.length === 0) {
        insertionPosition = 0;
      } else if (
        !overId.startsWith('available-') &&
        !overId.startsWith('collision-placeholder-') &&
        !isNaN(parseInt(overId)) &&
        localRankings.some(p => p.id === parseInt(overId))
      ) {
        const targetIndex = localRankings.findIndex(p => p.id === parseInt(overId));
        if (targetIndex !== -1) {
          insertionPosition = targetIndex;
        }
      }
      const pokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
      if (pokemon) {
        const isActuallyInRankings = localRankings.some(p => p.id === pokemonId);

        if (isActuallyInRankings) {
          const currentIndex = localRankings.findIndex(p => p.id === pokemonId);
          const newRankings = arrayMove(localRankings, currentIndex, insertionPosition);
          updateLocalRankings(newRankings);
          handleEnhancedManualReorder(pokemonId, currentIndex, insertionPosition);
        } else if (overIsRankingZone || insertionPosition !== localRankings.length) {
          // MODIFICATION: No optimistic update. Call move function directly.
          moveFromAvailableToRankings(pokemonId, insertionPosition, pokemon);
        }
      }
      return;
    }
  }, [enhancedAvailablePokemon, localRankings, handleEnhancedManualReorder, triggerReRanking, moveFromAvailableToRankings, updateLocalRankings]);

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    // For manual reorder calls, use immediate update (no setTimeout)
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  return {
    sensors,
    activeDraggedPokemon: dragState.activePokemon,
    dragSourceInfo: dragState.sourceInfo,
    sourceCardProps: dragState.cardProps,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
