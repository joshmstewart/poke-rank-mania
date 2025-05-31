
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
      console.log(`🔥 [DRAG_START] Dragging available: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🔥 [DRAG_START] Dragging ranked: ${draggedPokemon?.name} (ID: ${pokemonId})`);
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
      
      // More comprehensive check for rankings drop zone
      const isRankingsTarget = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-section' ||
        overId.startsWith('rankings') ||
        // Also check if dropped on any ranked pokemon
        (!overId.startsWith('available-') && !isNaN(parseInt(overId)))
      );
      
      console.log(`🔥 [DRAG_END] Is rankings target: ${isRankingsTarget}`);
      
      if (isRankingsTarget) {
        console.log(`🔥 [DRAG_END] Adding Pokemon ${pokemonId} to rankings`);
        
        const pokemon = availablePokemon.find(p => p.id === pokemonId);
        if (pokemon) {
          console.log(`🔥 [DRAG_END] Found pokemon:`, pokemon.name);
          
          // Add to TrueSkill store with default rating
          const defaultRating = new Rating(25.0, 8.333);
          updateRating(pokemonId, defaultRating);
          console.log(`🔥 [DRAG_END] Added rating to TrueSkill store for ${pokemonId}`);
          
          // Remove from available
          setAvailablePokemon(prev => {
            const newAvailable = prev.filter(p => p.id !== pokemonId);
            console.log(`🔥 [DRAG_END] Removed from available. New count: ${newAvailable.length}`);
            return newAvailable;
          });
          
          // Trigger sync to update rankings
          setTimeout(() => {
            const event = new CustomEvent('trueskill-store-updated', {
              detail: { pokemonId, source: 'drag-to-rankings' }
            });
            document.dispatchEvent(event);
            console.log(`🔥 [DRAG_END] Dispatched trueskill-store-updated event`);
          }, 100);
        } else {
          console.error(`🔥 [DRAG_END] ❌ Pokemon ${pokemonId} not found in available list!`);
        }
        return;
      } else {
        console.log(`🔥 [DRAG_END] Not a rankings target - ignoring drop`);
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

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🔥 [MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
