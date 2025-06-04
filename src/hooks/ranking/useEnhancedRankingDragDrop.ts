
import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { Rating } from "ts-trueskill";

export const useEnhancedRankingDragDrop = (
  enhancedAvailablePokemon: any[],
  localRankings: any[],
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  handleEnhancedManualReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void,
  triggerReRanking: (pokemonId: number) => Promise<void>
) => {
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  const { updateRating } = useTrueSkillStore();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] ===== ENHANCED DRAG START =====`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Active ID: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('draggable-available-')) {
      const pokemonId = parseInt(activeId.replace('draggable-available-', ''));
      draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Dragging available: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else if (activeId.startsWith('sortable-ranking-')) {
      const pokemonId = parseInt(activeId.replace('sortable-ranking-', ''));
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Dragging ranked: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] ✅ Drag start completed for: ${draggedPokemon?.name}`);
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ===== ENHANCED DRAG END START =====`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ❌ No drop target - ending`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log(`🎯 [VALIDATION_DEBUG] Dragging item: ${activeId} over target: ${overId}`);

    // Handle drag from available to rankings
    if (activeId.startsWith('draggable-available-')) {
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] === PROCESSING AVAILABLE POKEMON DROP ===`);
      const pokemonId = parseInt(activeId.replace('draggable-available-', ''));
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Available Pokemon ${pokemonId} dragged to ${overId}`);
      
      // CRITICAL FIX: More precise validation for drop targets
      const isValidRankedTarget = (
        overId.startsWith('sortable-ranking-') && 
        !isNaN(parseInt(overId.replace('sortable-ranking-', ''))) && 
        localRankings.some(p => p.id === parseInt(overId.replace('sortable-ranking-', '')))
      );
      
      // CRITICAL FIX: Also accept the rankings drop zone itself
      const isValidDropZone = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-grid-drop-zone' ||
        over.data?.current?.type === 'rankings-container'
      );
      
      const isValidDropTarget = isValidRankedTarget || isValidDropZone;
      
      console.log(`🎯 [VALIDATION_DEBUG] Valid ranked target: ${isValidRankedTarget}, Valid drop zone: ${isValidDropZone}, Overall valid: ${isValidDropTarget}`);
      
      if (isValidDropTarget) {
        console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ VALID DROP TARGET`);
        const pokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
        
        if (pokemon) {
          console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ Found pokemon: ${pokemon.name}`);
          
          // CRITICAL FIX: Always remove from available immediately when dropped on rankings
          console.log(`🔥🔥🔥 [STATE_UPDATE] Removing ${pokemon.name} from available list`);
          setAvailablePokemon(prev => {
            const newAvailable = prev.filter(p => p.id !== pokemonId);
            console.log(`🔥🔥🔥 [STATE_UPDATE] Available count: ${prev.length} -> ${newAvailable.length}`);
            return newAvailable;
          });
          
          // Add to TrueSkill store if not already ranked
          if (!pokemon.isRanked) {
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] Adding new Pokemon to rankings`);
            const defaultRating = new Rating(25.0, 8.333);
            updateRating(pokemonId.toString(), defaultRating);
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Added rating to TrueSkill store`);
          }
          
          // Determine insertion position based on drop target
          let insertionPosition = localRankings.length;
          if (isValidRankedTarget) {
            const targetPokemonId = parseInt(overId.replace('sortable-ranking-', ''));
            const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
            if (targetIndex !== -1) {
              insertionPosition = targetIndex;
              console.log(`🔥🔥🔥 [INSERT_POSITION] Will insert at position ${targetIndex} before ${localRankings[targetIndex]?.name}`);
            }
          }
          
          // Call enhanced manual reorder to add to rankings
          console.log(`🔥🔥🔥 [MANUAL_REORDER] Calling handleEnhancedManualReorder(${pokemonId}, -1, ${insertionPosition})`);
          try {
            handleEnhancedManualReorder(pokemonId, -1, insertionPosition);
            console.log(`🔥🔥🔥 [MANUAL_REORDER] ✅ Successfully added to rankings`);
          } catch (error) {
            console.error(`🔥🔥🔥 [MANUAL_REORDER] ❌ Failed:`, error);
          }
          
          return;
        } else {
          console.error(`🚀🚀🚀 [ENHANCED_DRAG_END] ❌ Pokemon ${pokemonId} not found in available list!`);
        }
      } else {
        console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ❌ Invalid drop target - ignoring`);
      }
      return;
    }

    // Handle reordering within rankings
    if (activeId.startsWith('sortable-ranking-') && overId.startsWith('sortable-ranking-')) {
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] === PROCESSING RANKING REORDER ===`);
      
      const activePokemonId = parseInt(activeId.replace('sortable-ranking-', ''));
      const overPokemonId = parseInt(overId.replace('sortable-ranking-', ''));
      
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Reorder: ${activePokemonId} -> ${overPokemonId}`);
      
      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Indices: ${oldIndex} -> ${newIndex}`);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ Valid reorder - calling handleEnhancedManualReorder`);
        try {
          handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
          console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ Reorder completed`);
        } catch (error) {
          console.error(`🚀🚀🚀 [ENHANCED_DRAG_END] ❌ Reorder failed:`, error);
        }
      }
    }
    
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ===== ENHANCED DRAG END COMPLETE =====`);
  }, [enhancedAvailablePokemon, localRankings, updateRating, setAvailablePokemon, handleEnhancedManualReorder]);

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🚀🚀🚀 [ENHANCED_MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    try {
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
      console.log(`🚀🚀🚀 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder completed`);
    } catch (error) {
      console.error(`🚀🚀🚀 [ENHANCED_MANUAL_REORDER] ❌ Manual reorder failed:`, error);
    }
  }, [handleEnhancedManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
