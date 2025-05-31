
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

  // CRITICAL FIX: Enhanced drag to rankings functionality
  const handleDragToRankings = useCallback((pokemonId: number) => {
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_START] ===== ENHANCED DRAG TO RANKINGS =====`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_ID] Pokemon ID: ${pokemonId}`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_COUNT] Current localRankings count: ${localRankings.length}`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_AVAILABLE] Available Pokemon count before: ${availablePokemon.length}`);
    
    const pokemon = availablePokemon.find(p => p.id === pokemonId);
    if (!pokemon) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_ERROR] Pokemon ${pokemonId} not found in available list`);
      return;
    }
    
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_FOUND] Found Pokemon: ${pokemon.name}`);
    
    try {
      const defaultRating = new Rating(25.0, 8.333); // Default TrueSkill values
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_RATING] Adding to TrueSkill store with default rating`);
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_VALUES] Default rating - mu: ${defaultRating.mu}, sigma: ${defaultRating.sigma}`);
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_UPDATE] About to call updateRating for Pokemon ID: ${pokemonId}`);
      
      updateRating(pokemonId, defaultRating);
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_UPDATED] updateRating called successfully`);
      
      // Remove from available Pokemon
      setAvailablePokemon(prev => {
        const updated = prev.filter(p => p.id !== pokemonId);
        console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_REMOVED] Removed from available (${prev.length} -> ${updated.length})`);
        return updated;
      });
      
      // Dispatch event to notify sync hook
      setTimeout(() => {
        const event = new CustomEvent('trueskill-store-updated', {
          detail: { pokemonId, source: 'drag-to-rankings' }
        });
        document.dispatchEvent(event);
        console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_EVENT] Store updated event dispatched`);
      }, 100);
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_SUCCESS] Pokemon ${pokemon.name} successfully added to rankings`);
    } catch (error) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_CATCH] Error adding Pokemon to TrueSkill:`, error);
    }
  }, [localRankings.length, availablePokemon, updateRating, setAvailablePokemon]);

  // Handle manual reordering within the rankings
  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔥🔥🔥 [MANUAL_REORDER] Manual reorder: Pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  // CRITICAL FIX: Enhanced drag handlers with improved detection
  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🔥🔥🔥 [DRAG_START_HANDLER] ===== DRAG START =====`);
    console.log(`🔥🔥🔥 [DRAG_START_ID] Active ID: ${event.active.id}`);
    console.log(`🔥🔥🔥 [DRAG_START_DATA] Active data:`, event.active.data.current);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = availablePokemon.find(p => p.id === pokemonId);
      console.log(`🔥🔥🔥 [DRAG_START_AVAILABLE] Dragging available Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🔥🔥🔥 [DRAG_START_RANKED] Dragging ranked Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  }, [availablePokemon, localRankings]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🔥🔥🔥 [DRAG_END_HANDLER] ===== DRAG END START =====`);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🔥🔥🔥 [DRAG_END_NO_TARGET] No drop target - drag cancelled`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log(`🔥🔥🔥 [DRAG_END_IDS] Active: ${activeId}, Over: ${overId}`);
    console.log(`🔥🔥🔥 [DRAG_END_OVER_DATA] Over data:`, over.data?.current);

    // CRITICAL FIX: Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🔥🔥🔥 [DRAG_END_AVAILABLE] Available Pokemon ${pokemonId} dragged`);
      
      // Enhanced drop target detection for rankings
      const isRankingsDropTarget = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-section' ||
        overId.includes('rankings') ||
        (over.data?.current?.type === 'rankings-container') ||
        (!overId.startsWith('available-') && !isNaN(parseInt(overId)) && localRankings.some(p => p.id === parseInt(overId)))
      );
      
      console.log(`🔥🔥🔥 [DRAG_END_TARGET_CHECK] Is rankings drop target: ${isRankingsDropTarget}`);
      
      if (isRankingsDropTarget) {
        console.log(`🔥🔥🔥 [DRAG_END_VALID_DROP] Valid drop to rankings - calling handleDragToRankings`);
        handleDragToRankings(pokemonId);
        return;
      } else {
        console.log(`🔥🔥🔥 [DRAG_END_INVALID_DROP] Invalid drop target for available Pokemon: ${overId}`);
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
        console.log(`🔥🔥🔥 [DRAG_END_REORDER] Reordering within rankings from ${oldIndex} to ${newIndex}`);
        handleManualReorder(activePokemonId, oldIndex, newIndex);
      } else {
        console.log(`🔥🔥🔥 [DRAG_END_INVALID_REORDER] Invalid reorder attempt: oldIndex=${oldIndex}, newIndex=${newIndex}`);
      }
    }
    
    console.log(`🔥🔥🔥 [DRAG_END_COMPLETE] ===== DRAG END COMPLETE =====`);
  }, [localRankings, handleDragToRankings, handleManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder,
    handleDragToRankings
  };
};
