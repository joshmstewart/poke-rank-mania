
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🔥 [DRAG_START] Active ID: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = availablePokemon.find(p => p.id === pokemonId);
      console.log(`🔥 [DRAG_START] Dragging available: ${draggedPokemon?.name}`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🔥 [DRAG_START] Dragging ranked: ${draggedPokemon?.name}`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  }, [availablePokemon, localRankings]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🔥 [DRAG_END] Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🔥 [DRAG_END] No drop target`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🔥 [DRAG_END] Available Pokemon ${pokemonId} dragged to ${overId}`);
      
      // Check if dropped on rankings area
      const isRankingsTarget = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-section' ||
        (!overId.startsWith('available-') && localRankings.some(p => p.id === parseInt(overId)))
      );
      
      if (isRankingsTarget) {
        console.log(`🔥 [DRAG_END] Adding to rankings`);
        
        const pokemon = availablePokemon.find(p => p.id === pokemonId);
        if (pokemon) {
          // Add to TrueSkill store with default rating
          const defaultRating = new Rating(25.0, 8.333);
          updateRating(pokemonId, defaultRating);
          
          // Remove from available
          setAvailablePokemon(prev => prev.filter(p => p.id !== pokemonId));
          
          // Trigger sync
          setTimeout(() => {
            const event = new CustomEvent('trueskill-store-updated', {
              detail: { pokemonId, source: 'drag-to-rankings' }
            });
            document.dispatchEvent(event);
          }, 100);
        }
        return;
      }
    }

    // Handle reordering within rankings
    if (!activeId.startsWith('available-') && !overId.startsWith('available-')) {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🔥 [DRAG_END] Reordering from ${oldIndex} to ${newIndex}`);
        handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
      }
    }
  }, [availablePokemon, localRankings, updateRating, setAvailablePokemon, handleEnhancedManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd
  };
};
