
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
    console.log(`🚀🚀🚀 [DRAG_START_CRITICAL] ===== DRAG START =====`);
    console.log(`🚀🚀🚀 [DRAG_START_CRITICAL] Active ID: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = availablePokemon.find(p => p.id === pokemonId);
      console.log(`🚀🚀🚀 [DRAG_START_CRITICAL] Dragging available: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🚀🚀🚀 [DRAG_START_CRITICAL] Dragging ranked: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  }, [availablePokemon, localRankings]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] ===== DRAG END =====`);
    console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] Over data:`, event.over?.data?.current);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] ❌ No drop target`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] Available Pokemon ${pokemonId} dragged to ${overId}`);
      
      // Check if dropped on any valid rankings target
      const isValidRankingsTarget = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-grid-drop-zone' ||
        over.data?.current?.type === 'rankings-container' ||
        over.data?.current?.type === 'rankings-grid' ||
        over.data?.current?.accepts?.includes('available-pokemon') ||
        // Also accept drops directly on ranked Pokemon (for insertion)
        (!overId.startsWith('available-') && 
         !isNaN(parseInt(overId)) && 
         localRankings.some(p => p.id === parseInt(overId)))
      );
      
      console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] Drop zone validation:`);
      console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] - overId: ${overId}`);
      console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] - over.data.current:`, over.data?.current);
      console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] - isValidRankingsTarget: ${isValidRankingsTarget}`);
      
      if (isValidRankingsTarget) {
        console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] ✅ VALID DROP - Adding Pokemon ${pokemonId} to rankings`);
        
        const pokemon = availablePokemon.find(p => p.id === pokemonId);
        if (pokemon) {
          console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] ✅ Found pokemon:`, pokemon.name);
          
          // Add to TrueSkill store with default rating
          const defaultRating = new Rating(25.0, 8.333);
          updateRating(pokemonId, defaultRating);
          console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] ✅ Added rating to TrueSkill store for ${pokemonId}`);
          
          // Remove from available list IMMEDIATELY
          setAvailablePokemon(prev => {
            const newAvailable = prev.filter(p => p.id !== pokemonId);
            console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] ✅ Removed from available. Count: ${prev.length} -> ${newAvailable.length}`);
            return newAvailable;
          });
          
          // IMMEDIATE sync without delay - dispatch event synchronously
          const event = new CustomEvent('trueskill-store-updated', {
            detail: { pokemonId, source: 'drag-to-rankings', action: 'add' }
          });
          document.dispatchEvent(event);
          console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] ✅ Dispatched trueskill-store-updated event immediately`);
          
          return;
        } else {
          console.error(`🚀🚀🚀 [DRAG_END_CRITICAL] ❌ Pokemon ${pokemonId} not found in available list!`);
        }
      } else {
        console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] ❌ Invalid drop target - ignoring`);
      }
      return;
    }

    // Handle reordering within rankings
    if (!activeId.startsWith('available-') && !overId.startsWith('available-')) {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🚀🚀🚀 [DRAG_END_CRITICAL] ✅ Reordering from ${oldIndex} to ${newIndex}`);
        handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
      }
    }
  }, [availablePokemon, localRankings, updateRating, setAvailablePokemon, handleEnhancedManualReorder]);

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🚀🚀🚀 [MANUAL_REORDER_CRITICAL] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
