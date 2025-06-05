
import { useCallback } from "react";
import { DragEndEvent } from '@dnd-kit/core';
import { parseId } from "../utils/idParsing";
import { handleAvailableToRankingsDrop } from "./availableToDragHandler";
import { handleRankingReorder } from "./reorderHandler";
import { Rating } from "ts-trueskill";

export const useDragEndHandler = (
  enhancedAvailablePokemon: any[],
  localRankings: any[],
  updateRating: (id: string, rating: Rating) => void,
  handleEnhancedManualReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void,
  triggerReRanking: (pokemonId: number) => Promise<void>,
  setActiveDraggedPokemon: (pokemon: any) => void
) => {
  return useCallback((event: DragEndEvent) => {
    console.log(`🚀 [ENHANCED_DRAG_END] Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🚀 [ENHANCED_DRAG_END] No drop target`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const { pokemonId } = parseId(activeId);
      if (pokemonId === null) return;

      handleAvailableToRankingsDrop(
        pokemonId,
        overId,
        over,
        enhancedAvailablePokemon,
        localRankings,
        updateRating,
        handleEnhancedManualReorder,
        triggerReRanking
      );
      return;
    }

    // Handle reordering within rankings
    if (!activeId.startsWith('available-') && !overId.startsWith('available-')) {
      handleRankingReorder(
        activeId,
        overId,
        over,
        localRankings,
        handleEnhancedManualReorder
      );
    }
  }, [enhancedAvailablePokemon, localRankings, updateRating, handleEnhancedManualReorder, triggerReRanking, setActiveDraggedPokemon]);
};
