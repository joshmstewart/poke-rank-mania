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
    const activeDataType = active.data.current?.type;
    const overDataType = over.data.current?.type;

    console.log(`[DragEnd] Active: ${activeId} (${activeDataType}), Over: ${overId} (${overDataType})`, over.data.current);

    if (active.id === over.id) return;
    if (activeDataType === 'available-pokemon' && overDataType === 'available-pokemon') return;

    // --- Scenario 1: Reordering within the ranked list ---
    if (activeDataType === 'ranked-pokemon' && overDataType === 'ranked-pokemon') {
      const activePokemonId = Number(active.id);
      const overPokemonId = Number(over.id);

      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newOrder = arrayMove(localRankings, oldIndex, newIndex);
        updateLocalRankings(newOrder); // Optimistic UI update
        handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex); // Persist change
      }
      return;
    }

    // --- Scenario 2: Dropping a new Pokemon into the ranked list ---
    if (activeDataType === 'available-pokemon') {
      const pokemonId = parseInt(activeId.replace('available-', ''), 10);
      const pokemonToAdd = enhancedAvailablePokemon.find(p => p.id === pokemonId);

      if (!pokemonToAdd) return;
      if (localRankings.some(p => p.id === pokemonId)) return; // Already ranked

      let insertionIndex = -1;

      // Dropped onto an existing ranked pokemon
      if (overDataType === 'ranked-pokemon') {
        const overPokemonId = Number(overId);
        const targetIndex = localRankings.findIndex(p => p.id === overPokemonId);
        if (targetIndex !== -1) {
          insertionIndex = targetIndex;
        }
      } 
      // Dropped onto the ranking grid container itself
      else if (overId === 'rankings-grid-drop-zone' || overDataType === 'rankings-grid') {
        insertionIndex = localRankings.length;
      }

      if (insertionIndex !== -1) {
        moveFromAvailableToRankings(pokemonId, insertionIndex, pokemonToAdd);
      } else {
        console.log('[DragEnd] Could not determine insertion point for available pokemon.');
      }
      return;
    }
  }, [enhancedAvailablePokemon, localRankings, handleEnhancedManualReorder, moveFromAvailableToRankings, updateLocalRankings]);

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
