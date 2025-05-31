
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
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] ===== ENHANCED DRAG TO RANKINGS =====`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] Pokemon ID: ${pokemonId}`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] Current localRankings count: ${localRankings.length}`);
    
    const pokemon = availablePokemon.find(p => p.id === pokemonId);
    if (!pokemon) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] ❌ Pokemon ${pokemonId} not found in available list`);
      return;
    }
    
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] ✅ Found Pokemon: ${pokemon.name}`);
    
    // Add to TrueSkill store with default rating
    try {
      const TrueSkill = require('ts-trueskill');
      const defaultRating = new TrueSkill.Rating();
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] Adding to TrueSkill store with default rating`);
      updateRating(pokemonId, defaultRating);
      
      // Remove from available Pokemon
      setAvailablePokemon(prev => {
        const updated = prev.filter(p => p.id !== pokemonId);
        console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] Removed from available (${prev.length} -> ${updated.length})`);
        return updated;
      });
      
      // Dispatch event to notify sync hook
      setTimeout(() => {
        const event = new CustomEvent('trueskill-store-updated');
        document.dispatchEvent(event);
        console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] ✅ Store updated event dispatched`);
      }, 50);
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] ✅ Pokemon ${pokemon.name} successfully added to rankings`);
    } catch (error) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_ENHANCED] ❌ Error adding Pokemon to TrueSkill:`, error);
    }
  }, [localRankings.length, availablePokemon, updateRating, setAvailablePokemon]);

  // Handle manual reordering within the rankings
  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔥 [RANKING_DRAG_DROP] Manual reorder: Pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  // CRITICAL FIX: Enhanced drag handlers with comprehensive logging
  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🔥🔥🔥 [DRAG_START_ENHANCED] ===== DRAG START =====`);
    console.log(`🔥🔥🔥 [DRAG_START_ENHANCED] Active ID: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = availablePokemon.find(p => p.id === pokemonId);
      console.log(`🔥🔥🔥 [DRAG_START_ENHANCED] Dragging available Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🔥🔥🔥 [DRAG_START_ENHANCED] Dragging ranked Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  }, [availablePokemon, localRankings]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] ===== DRAG END START =====`);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] No drop target - drag cancelled`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] Active: ${activeId}`);
    console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] Over: ${overId}`);
    console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] Over data:`, over.data?.current);

    // CRITICAL FIX: Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] Available Pokemon ${pokemonId} dragged`);
      
      // CRITICAL FIX: Enhanced drop target detection
      const isRankingsDropTarget = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-section' ||
        (over.data?.current?.type === 'rankings-container') ||
        (!overId.startsWith('available-') && !isNaN(parseInt(overId)) && localRankings.some(p => p.id === parseInt(overId)))
      );
      
      console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] Is rankings drop target: ${isRankingsDropTarget}`);
      
      if (isRankingsDropTarget) {
        console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] ✅ Valid drop to rankings - calling handleDragToRankings`);
        handleDragToRankings(pokemonId);
        return;
      } else {
        console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] ❌ Invalid drop target for available Pokemon: ${overId}`);
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
        console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] ✅ Reordering within rankings from ${oldIndex} to ${newIndex}`);
        handleManualReorder(activePokemonId, oldIndex, newIndex);
      } else {
        console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] ❌ Invalid reorder attempt: oldIndex=${oldIndex}, newIndex=${newIndex}`);
      }
    }
    
    console.log(`🔥🔥🔥 [DRAG_END_ENHANCED] ===== DRAG END COMPLETE =====`);
  }, [localRankings, handleDragToRankings, handleManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder,
    handleDragToRankings
  };
};
