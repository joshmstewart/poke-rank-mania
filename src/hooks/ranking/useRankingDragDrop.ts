
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

  // CRITICAL FIX: Enhanced drag to rankings functionality with proper error handling
  const handleDragToRankings = useCallback((pokemonId: number) => {
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ===== ENHANCED DRAG TO RANKINGS =====`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Pokemon ID: ${pokemonId}`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Current localRankings count: ${localRankings.length}`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Available Pokemon count before: ${availablePokemon.length}`);
    
    const pokemon = availablePokemon.find(p => p.id === pokemonId);
    if (!pokemon) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ❌ Pokemon ${pokemonId} not found in available list`);
      return;
    }
    
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ✅ Found Pokemon: ${pokemon.name}`);
    
    try {
      const defaultRating = new Rating(25.0, 8.333); // Default TrueSkill values
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Adding to TrueSkill store with default rating`);
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Default rating - mu: ${defaultRating.mu}, sigma: ${defaultRating.sigma}`);
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] About to call updateRating for Pokemon ID: ${pokemonId}`);
      
      updateRating(pokemonId, defaultRating);
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ✅ updateRating called successfully`);
      
      // Remove from available Pokemon
      setAvailablePokemon(prev => {
        const updated = prev.filter(p => p.id !== pokemonId);
        console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Removed from available (${prev.length} -> ${updated.length})`);
        return updated;
      });
      
      // Dispatch event to notify sync hook with delay to ensure state updates
      setTimeout(() => {
        const event = new CustomEvent('trueskill-store-updated', {
          detail: { pokemonId, source: 'drag-to-rankings' }
        });
        document.dispatchEvent(event);
        console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ✅ Store updated event dispatched`);
      }, 100);
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ✅ Pokemon ${pokemon.name} successfully added to rankings`);
    } catch (error) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ❌ Error adding Pokemon to TrueSkill:`, error);
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Error details:`, {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
    }
  }, [localRankings.length, availablePokemon, updateRating, setAvailablePokemon]);

  // Handle manual reordering within the rankings
  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔥🔥🔥 [RANKING_DRAG_DROP_CRITICAL] Manual reorder: Pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  // CRITICAL FIX: Enhanced drag handlers with comprehensive logging
  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🔥🔥🔥 [DRAG_START_CRITICAL] ===== DRAG START =====`);
    console.log(`🔥🔥🔥 [DRAG_START_CRITICAL] Active ID: ${event.active.id}`);
    console.log(`🔥🔥🔥 [DRAG_START_CRITICAL] Active data:`, event.active.data.current);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = availablePokemon.find(p => p.id === pokemonId);
      console.log(`🔥🔥🔥 [DRAG_START_CRITICAL] Dragging available Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🔥🔥🔥 [DRAG_START_CRITICAL] Dragging ranked Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  }, [availablePokemon, localRankings]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] ===== DRAG END START =====`);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] No drop target - drag cancelled`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] Active: ${activeId}`);
    console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] Over: ${overId}`);
    console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] Over data:`, over.data?.current);

    // CRITICAL FIX: Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] Available Pokemon ${pokemonId} dragged`);
      
      // CRITICAL FIX: Enhanced drop target detection for rankings
      const isRankingsDropTarget = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-section' ||
        overId.includes('rankings') ||
        (over.data?.current?.type === 'rankings-container') ||
        (!overId.startsWith('available-') && !isNaN(parseInt(overId)) && localRankings.some(p => p.id === parseInt(overId)))
      );
      
      console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] Is rankings drop target: ${isRankingsDropTarget}`);
      console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] Drop target analysis - overId: "${overId}"`);
      
      if (isRankingsDropTarget) {
        console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] ✅ Valid drop to rankings - calling handleDragToRankings`);
        handleDragToRankings(pokemonId);
        return;
      } else {
        console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] ❌ Invalid drop target for available Pokemon: ${overId}`);
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
        console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] ✅ Reordering within rankings from ${oldIndex} to ${newIndex}`);
        handleManualReorder(activePokemonId, oldIndex, newIndex);
      } else {
        console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] ❌ Invalid reorder attempt: oldIndex=${oldIndex}, newIndex=${newIndex}`);
      }
    }
    
    console.log(`🔥🔥🔥 [DRAG_END_CRITICAL] ===== DRAG END COMPLETE =====`);
  }, [localRankings, handleDragToRankings, handleManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder,
    handleDragToRankings
  };
};
