
import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { Rating } from "ts-trueskill";

export const useRankingDragDrop = (
  availablePokemon: any[],
  localRankings: any[],
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  handleEnhancedManualReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void
) => {
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  const { updateRating } = useTrueSkillStore();

  const handleDragToRankings = useCallback((pokemonId: number) => {
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS] Adding Pokemon ${pokemonId} to rankings`);
    
    const pokemon = availablePokemon.find(p => p.id === pokemonId);
    if (!pokemon) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_ERROR] Pokemon ${pokemonId} not found`);
      return;
    }
    
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_FOUND] Found Pokemon: ${pokemon.name}`);
    
    try {
      const defaultRating = new Rating(25.0, 8.333);
      updateRating(pokemonId, defaultRating);
      
      // Remove from available Pokemon
      setAvailablePokemon(prev => prev.filter(p => p.id !== pokemonId));
      
      // Dispatch event to notify sync hook
      setTimeout(() => {
        const event = new CustomEvent('trueskill-store-updated', {
          detail: { pokemonId, source: 'drag-to-rankings' }
        });
        document.dispatchEvent(event);
      }, 100);
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_SUCCESS] Pokemon ${pokemon.name} added to rankings`);
    } catch (error) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_CATCH] Error:`, error);
    }
  }, [availablePokemon, updateRating, setAvailablePokemon]);

  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔥🔥🔥 [MANUAL_REORDER] Pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🔥🔥🔥 [DRAG_START] Active ID: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = availablePokemon.find(p => p.id === pokemonId);
      console.log(`🔥🔥🔥 [DRAG_START_AVAILABLE] Dragging available: ${draggedPokemon?.name}`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🔥🔥🔥 [DRAG_START_RANKED] Dragging ranked: ${draggedPokemon?.name}`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  }, [availablePokemon, localRankings]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🔥🔥🔥 [DRAG_END] Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🔥🔥🔥 [DRAG_END_NO_TARGET] No drop target`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🔥🔥🔥 [DRAG_END_AVAILABLE] Available Pokemon ${pokemonId} dragged`);
      
      const isRankingsDropTarget = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-section' ||
        overId.includes('rankings') ||
        (over.data?.current?.type === 'rankings-container') ||
        (!overId.startsWith('available-') && !isNaN(parseInt(overId)) && localRankings.some(p => p.id === parseInt(overId)))
      );
      
      if (isRankingsDropTarget) {
        console.log(`🔥🔥🔥 [DRAG_END_VALID_DROP] Valid drop to rankings`);
        handleDragToRankings(pokemonId);
        return;
      }
    }

    // Handle reordering within rankings
    if (!activeId.startsWith('available-') && !overId.startsWith('available-') && overId !== 'rankings-drop-zone') {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🔥🔥🔥 [DRAG_END_REORDER] Reordering from ${oldIndex} to ${newIndex}`);
        handleManualReorder(activePokemonId, oldIndex, newIndex);
      }
    }
  }, [localRankings, handleDragToRankings, handleManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder,
    handleDragToRankings
  };
};
