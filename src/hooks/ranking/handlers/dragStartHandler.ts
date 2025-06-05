
import { useCallback } from "react";
import { DragStartEvent } from '@dnd-kit/core';
import { parseId } from "../utils/idParsing";

export const useDragStartHandler = (
  enhancedAvailablePokemon: any[],
  localRankings: any[],
  setActiveDraggedPokemon: (pokemon: any) => void
) => {
  return useCallback((event: DragStartEvent) => {
    console.log(`🚀 [ENHANCED_DRAG_START] Active ID: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const { pokemonId } = parseId(activeId);
      if (pokemonId !== null) {
        draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
        console.log(`🚀 [ENHANCED_DRAG_START] Dragging available: ${draggedPokemon?.name} (ID: ${pokemonId})`);
      }
    } else {
      const { pokemonId } = parseId(activeId);
      if (pokemonId !== null) {
        draggedPokemon = localRankings.find(p => p.id === pokemonId);
        console.log(`🚀 [ENHANCED_DRAG_START] Dragging ranked: ${draggedPokemon?.name} (ID: ${pokemonId})`);
      }
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  }, [enhancedAvailablePokemon, localRankings, setActiveDraggedPokemon]);
};
