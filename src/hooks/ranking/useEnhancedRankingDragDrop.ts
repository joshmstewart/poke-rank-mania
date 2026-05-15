
import React, { useState, useCallback, useEffect, useRef } from "react";
import { DragEndEvent, DragStartEvent, DragOverEvent, useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
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

  // Visual placeholder index while dragging an Available card over Rankings.
  // null = no preview; number = render an empty slot at this index so ranked
  // cards visibly shift to make room (since the available card is not part of
  // the SortableContext, dnd-kit cannot animate the shift on its own).
  const [insertionPreviewIndex, setInsertionPreviewIndex] = useState<number | null>(null);

  // Snapshot of ranked card rects taken at drag start. We compute the
  // insertion index from these stable positions so the live placeholder shift
  // doesn't cause oscillation (cards shifting -> over target changes -> index
  // flips -> cards shift back).
  const rankedRectsRef = useRef<Array<{ id: number; rect: DOMRect }>>([]);
  // Mirror of insertionPreviewIndex so handleDragEnd can read the latest value
  // synchronously (state updates from handleDragOver may not have flushed).
  const insertionPreviewIndexRef = useRef<number | null>(null);
  // rAF handle for coalescing setInsertionPreviewIndex calls during drag.
  const rafRef = useRef<number | null>(null);

  // Use the atomic Pokemon movement hook
  const { moveFromAvailableToRankings } = usePokemonMovement(
    setAvailablePokemon,
    localRankings,
    updateLocalRankings
  );

  // Tap-to-add support: cards in the Available list dispatch an
  // "add-pokemon-to-rankings" CustomEvent. We handle it here so the same code
  // path as drag-drop is used (single source of truth for ranking insertion).
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ pokemonId: number }>).detail;
      const pokemonId = detail?.pokemonId;
      if (typeof pokemonId !== 'number') return;
      const pokemonToAdd = enhancedAvailablePokemon.find((p) => p.id === pokemonId);
      if (!pokemonToAdd) return;
      if (localRankings.some((p) => p.id === pokemonId)) return;
      moveFromAvailableToRankings(pokemonId, localRankings.length, pokemonToAdd);
    };
    document.addEventListener('add-pokemon-to-rankings', handler);
    return () => document.removeEventListener('add-pokemon-to-rankings', handler);
  }, [enhancedAvailablePokemon, localRankings, moveFromAvailableToRankings]);

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
    let draggedPokemon = null;
    let sourceInfo = { fromAvailable: false, isRanked: false };
    let cardProps = null;

    console.log(`[PURE_DND_START] ===== DRAG START =====`);
    console.log(`[PURE_DND_START] Active ID: ${activeId}`);

    if (activeId.startsWith('available-')) {
      // Snapshot ranked card rects for stable insertion-index calculation.
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('[data-ranked-id]')
      );
      rankedRectsRef.current = els
        .map((el) => ({
          id: Number(el.dataset.rankedId),
          rect: el.getBoundingClientRect(),
        }))
        .filter((entry) => Number.isFinite(entry.id));

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

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    const activeId = active.id.toString();
    if (!activeId.startsWith('available-')) {
      setInsertionPreviewIndex(null);
      return;
    }

    // Use the dragged item's translated rect center as the cursor proxy.
    const translated = active.rect.current.translated;
    if (!translated) {
      setInsertionPreviewIndex(null);
      return;
    }
    const cx = translated.left + translated.width / 2;
    const cy = translated.top + translated.height / 2;

    const rects = rankedRectsRef.current;
    if (rects.length === 0) {
      // No ranked cards yet — only valid drop is into the empty drop zone.
      const overType = over?.data?.current?.type;
      const overId = over?.id?.toString();
      if (overId === 'rankings-drop-zone' || overType === 'rankings-container') {
        setInsertionPreviewIndex(0);
      } else {
        setInsertionPreviewIndex(null);
      }
      return;
    }

    // Determine insertion index using ORIGINAL (snapshot) rects, so layout
    // shifts caused by the placeholder cannot retrigger this calculation.
    // Strategy: pick the card whose center is closest to the cursor, then
    // decide whether to insert BEFORE it (cursor on its left half) or AFTER
    // it (cursor on its right half). This matches a row/column grid intuitively
    // and avoids the "upper-half-of-row jumps to row start" bug.
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i].rect;
      const ccx = r.left + r.width / 2;
      const ccy = r.top + r.height / 2;
      const dx = cx - ccx;
      const dy = cy - ccy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    let insertion = rects.length;
    if (bestIdx !== -1) {
      const r = rects[bestIdx].rect;
      const ccx = r.left + r.width / 2;
      insertion = cx < ccx ? bestIdx : bestIdx + 1;
    }

    // Only trigger a re-render when the index actually changes.
    insertionPreviewIndexRef.current = insertion;
    setInsertionPreviewIndex((prev) => (prev === insertion ? prev : insertion));
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    console.log(`[PURE_DND_END] ===== DRAG END =====`);

    setDragState({ activePokemon: null, sourceInfo: null, cardProps: null });
    const previewIndex = insertionPreviewIndexRef.current;
    setInsertionPreviewIndex(null);
    insertionPreviewIndexRef.current = null;
    rankedRectsRef.current = [];
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
        const insertAt = previewIndex ?? localRankings.length;
        moveFromAvailableToRankings(pokemonId, insertAt, pokemonToAdd);
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

    // Handle available card dropped onto an existing ranked card: insert before that ranked card.
    if (overDataType === 'ranked-pokemon' && isFromAvailable) {
      const overPokemonId = parseInt(overId.replace('ranked-', ''));
      // Prefer the previewed insertion index (computed from snapshot rects),
      // falling back to the over-target's index so behavior never regresses.
      const fallbackIndex = localRankings.findIndex(p => p.id === overPokemonId);
      const targetIndex = previewIndex ?? fallbackIndex;
      const pokemonToAdd = enhancedAvailablePokemon.find(p => p.id === pokemonId);

      if (!pokemonToAdd) {
        console.warn('[DnD_SKIP]', 'available pokemon not found for ranked-card drop', { active, over });
        return;
      }

      if (targetIndex === -1) {
        console.warn('[DnD_SKIP]', 'ranked drop target not found', { active, over });
        return;
      }

      if (localRankings.some(p => p.id === pokemonId)) {
        console.warn('[DnD_SKIP]', 'pokemon already ranked', { active, over });
        return;
      }

      console.log(`[PURE_DND_END] Moving ${pokemonToAdd.name} from available before ranked ID ${overPokemonId} at index ${targetIndex}`);
      moveFromAvailableToRankings(pokemonId, targetIndex, pokemonToAdd);
      return;
    }

    // Handle drop onto ranking position
    if (overDataType === 'ranking-position') {
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

        console.log(`[PURE_DND_END] Moving ${pokemonToAdd.name} from available to rankings at index ${targetIndex}`);
        moveFromAvailableToRankings(pokemonId, targetIndex, pokemonToAdd);
      } else if (isFromRanked) {
        // Reordering within rankings
        const oldIndex = localRankings.findIndex(p => p.id === pokemonId);
        
        if (oldIndex !== -1 && targetIndex !== undefined && oldIndex !== targetIndex) {
          console.log(`[PURE_DND_END] Reordering ranked: ${pokemonId} from ${oldIndex} to ${targetIndex}`);
          handleEnhancedManualReorder(pokemonId, oldIndex, targetIndex);
        }
      }
      return;
    }

    // Handle drop onto another ranked Pokemon
    if (overDataType === 'ranked-pokemon' && isFromRanked) {
      const overPokemonId = parseInt(overId.replace('ranked-', ''));
      const oldIndex = localRankings.findIndex(p => p.id === pokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`[PURE_DND_END] Reordering ranked: ${pokemonId} from ${oldIndex} to ${newIndex}`);
        handleEnhancedManualReorder(pokemonId, oldIndex, newIndex);
      }
      return;
    }

    console.warn('[DnD_SKIP]', 'unhandled drop combination', { active, over });
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
    insertionPreviewIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleManualReorder
  };
};
