
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
        distance: 3,
        delay: 0,
        tolerance: 2,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
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

    console.log(`[DRAG_START] Active ID: ${activeId}`);

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

      console.log(`[DRAG_START] Available Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
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

      console.log(`[DRAG_START] Ranked Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
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
    
    console.log(`[DRAG_END_DETAILED] Full event:`, {
      active: {
        id: active.id,
        data: active.data.current,
        rect: active.rect
      },
      over: over ? {
        id: over.id,
        data: over.data.current,
        rect: over.rect
      } : null,
      allDroppables: event.collisions?.map(c => ({
        id: c.id,
        data: c.data
      })) || 'no collisions'
    });
    
    if (!over) {
      console.log('[DRAG_END] No valid drop target');
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const activeDataType = active.data.current?.type;
    const overDataType = over.data.current?.type;

    console.log(`[DRAG_END] Active: ${activeId} (${activeDataType}), Over: ${overId} (${overDataType})`);
    console.log(`[DRAG_END] Over data:`, over.data.current);
    console.log(`[DRAG_END] Over accepts:`, over.data.current?.accepts);

    if (active.id === over.id) {
      console.log('[DRAG_END] Dropped on self, no action needed');
      return;
    }

    // Extract the actual Pokemon ID, handling "available-" prefix
    const isFromAvailable = activeId.startsWith('available-');
    const pokemonId = isFromAvailable 
      ? parseInt(activeId.replace('available-', ''))
      : parseInt(activeId);

    console.log(`[DRAG_END] Extracted Pokemon ID: ${pokemonId}, isFromAvailable: ${isFromAvailable}`);

    // Don't allow reordering within available pokemon
    if (activeDataType === 'available-pokemon' && overDataType === 'available-pokemon') {
      console.log('[DRAG_END] Available to available - ignoring');
      return;
    }

    // --- Scenario 1: Reordering within the ranked list ---
    if (activeDataType === 'ranked-pokemon' && overDataType === 'ranked-pokemon') {
      const overPokemonId = Number(overId);

      const oldIndex = localRankings.findIndex(p => p.id === pokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`[DRAG_END] Reordering ranked: ${pokemonId} from ${oldIndex} to ${newIndex}`);
        const newOrder = arrayMove(localRankings, oldIndex, newIndex);
        updateLocalRankings(newOrder);
        handleEnhancedManualReorder(pokemonId, oldIndex, newIndex);
      }
      return;
    }

    // --- Scenario 2: Dropping a new Pokemon into the ranked list ---
    if (isFromAvailable) {
      const pokemonToAdd = enhancedAvailablePokemon.find(p => p.id === pokemonId);

      if (!pokemonToAdd) {
        console.log('[DRAG_END] Pokemon not found in available list');
        return;
      }
      
      if (localRankings.some(p => p.id === pokemonId)) {
        console.log('[DRAG_END] Pokemon already ranked, ignoring');
        return;
      }

      let insertionIndex = -1;

      console.log(`[DRAG_END] Handling drop of AVAILABLE pokemon ${pokemonId}. Over ID: ${overId}, Over Type: ${overDataType}`);

      // Check if the over target accepts available-pokemon
      const overAccepts = over.data.current?.accepts || [];
      if (!overAccepts.includes('available-pokemon')) {
        console.log('[DRAG_END] Drop target does not accept available-pokemon');
        return;
      }

      // Dropped onto an existing ranked pokemon
      if (overDataType === 'ranked-pokemon') {
        const overPokemonId = Number(overId);
        const targetIndex = localRankings.findIndex(p => p.id === overPokemonId);
        if (targetIndex !== -1) {
          insertionIndex = targetIndex;
          console.log(`[DRAG_END] Insertion target is ranked-pokemon. Index: ${insertionIndex}`);
        }
      } 
      // Dropped onto the ranking grid container itself
      else if (overId === 'rankings-grid-drop-zone' || overDataType === 'rankings-grid') {
        insertionIndex = localRankings.length;
        console.log(`[DRAG_END] Insertion target is rankings-grid. Index: ${insertionIndex}`);
      }

      if (insertionIndex !== -1) {
        console.log(`[DRAG_END] Moving ${pokemonToAdd.name} to rankings at index ${insertionIndex}`);
        moveFromAvailableToRankings(pokemonId, insertionIndex, pokemonToAdd);
      } else {
        console.log('[DRAG_END] Could not determine insertion point for available pokemon. over data:', over.data.current, 'over id:', over.id);
      }
      return;
    }
  }, [enhancedAvailablePokemon, localRankings, handleEnhancedManualReorder, moveFromAvailableToRankings, updateLocalRankings]);

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
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
