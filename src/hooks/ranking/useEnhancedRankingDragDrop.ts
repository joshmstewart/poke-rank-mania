
import React, { useState, useCallback } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  useSensors,
  useSensor,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { usePokemonMovement } from "./usePokemonMovement";

export const useEnhancedRankingDragDrop = (
  enhancedAvailablePokemon: (Pokemon | RankedPokemon)[],
  localRankings: (Pokemon | RankedPokemon)[],
  setAvailablePokemon: React.Dispatch<
    React.SetStateAction<(Pokemon | RankedPokemon)[]>
  >,
  handleEnhancedManualReorder: (
    pokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => void,
  triggerReRanking: (pokemonId: number) => Promise<void>,
) => {
  const [dragState, setDragState] = useState<{
    activePokemon: Pokemon | RankedPokemon | null;
    sourceInfo: { fromAvailable: boolean; isRanked: boolean } | null;
    cardProps: Record<string, unknown> | null;
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = event.active.id.toString();
    let draggedPokemon: Pokemon | RankedPokemon | null = null;
    let sourceInfo = { fromAvailable: false, isRanked: false };
    let cardProps: Record<string, unknown> | null = null;

    console.log(`[PURE_DND_START] ===== DRAG START =====`);
    console.log(`[PURE_DND_START] Active ID: ${activeId}`);

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
        context: "available" as const,
        allRankedPokemon: localRankings
      };

      console.log(`[PURE_DND_START] Available Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else if (activeId.startsWith('ranked-')) {
      const pokemonId = parseInt(activeId.replace('ranked-', ''));
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
        context: "ranked" as const,
        allRankedPokemon: localRankings
      };

      console.log(`[PURE_DND_START] Ranked Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }

    setDragState({
      activePokemon: draggedPokemon,
      sourceInfo: sourceInfo,
      cardProps: cardProps,
    });
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    console.log(`[PURE_DND_END] ===== DRAG END =====`);
    
    setDragState({ activePokemon: null, sourceInfo: null, cardProps: null });
    const { active, over } = event;
    
    console.log(`[PURE_DND_END] Active ID: ${active.id}, Over ID: ${over?.id || 'none'}`);
    console.log(`[PURE_DND_END] Over data:`, over?.data?.current);
    
    if (!over) {
      console.log('[PURE_DND_END] No valid drop target');
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const activeDataType = active.data.current?.type;
    const overDataType = over.data.current?.type;

    console.log(`[PURE_DND_END] Active: ${activeId} (${activeDataType}), Over: ${overId} (${overDataType})`);

    const isFromAvailable = activeId.startsWith('available-');
    const isFromRanked = activeId.startsWith('ranked-');

    // REPLACE your previous rankings-drop-zone equality check with this:
    const overType = over.data?.current?.type;
    const overIsRankingsContainer =
      overId === "rankings-drop-zone" || overType === "rankings-container";

    if (overIsRankingsContainer && isFromAvailable) {
      const pokemonId = parseInt(activeId.replace("available-", ""));
      const pokemonToAdd = enhancedAvailablePokemon.find((p) => p.id === pokemonId);
      if (pokemonToAdd && !localRankings.some((p) => p.id === pokemonId)) {
        // append to end
        moveFromAvailableToRankings(pokemonId, localRankings.length, pokemonToAdd);
      }
      return;
    }
    
    if (active.id === over.id) {
      console.log('[PURE_DND_END] Dropped on self, no action needed');
      return;
    }
    const pokemonId = isFromAvailable 
      ? parseInt(activeId.replace('available-', ''))
      : isFromRanked
        ? parseInt(activeId.replace('ranked-', ''))
        : parseInt(activeId);

    console.log(`[PURE_DND_END] Extracted Pokemon ID: ${pokemonId}, isFromAvailable: ${isFromAvailable}`);

    // Handle drop onto a specific ranked card or position
    if (overDataType === 'ranking-position' || overDataType === 'ranked-pokemon') {
      const targetIndex = over.data.current?.index;

      if (isFromAvailable) {
        const pokemonToAdd = enhancedAvailablePokemon.find(p => p.id === pokemonId);
        if (!pokemonToAdd) {
          console.log('[PURE_DND_END] Pokemon not found in available list');
          return;
        }

        if (localRankings.some(p => p.id === pokemonId)) {
          console.log('[PURE_DND_END] Pokemon already ranked, ignoring');
          return;
        }

        const insertionIndex = targetIndex ?? localRankings.length;
        console.log(`[PURE_DND_END] Moving ${pokemonToAdd.name} from available to rankings at index ${insertionIndex}`);
        moveFromAvailableToRankings(pokemonId, insertionIndex, pokemonToAdd);
      } else if (isFromRanked) {
        const oldIndex = localRankings.findIndex(p => p.id === pokemonId);
        const newIndex = targetIndex;

        if (oldIndex !== -1 && newIndex !== undefined && oldIndex !== newIndex) {
          console.log(`[PURE_DND_END] Reordering ranked: ${pokemonId} from ${oldIndex} to ${newIndex}`);
          handleEnhancedManualReorder(pokemonId, oldIndex, newIndex);
        }
      }
      return;
    }
  }, [enhancedAvailablePokemon, localRankings, handleEnhancedManualReorder, moveFromAvailableToRankings]);

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
    handleManualReorder,
  };
};
