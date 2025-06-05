
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

  const parseId = (id: string): number | null => {
    if (id.startsWith('available-')) {
      return parseInt(id.replace('available-', ''), 10);
    }
    if (id.startsWith('ranking-')) {
      return parseInt(id.replace('ranking-', ''), 10);
    }
    if (id.startsWith('ranking-position-')) {
      return parseInt(id.replace('ranking-position-', ''), 10);
    }
    const numeric = parseInt(id, 10);
    return isNaN(numeric) ? null : numeric;
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🚀 [ENHANCED_DRAG_START] Active ID: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseId(activeId);
      if (pokemonId !== null) {
        draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
        console.log(`🚀 [ENHANCED_DRAG_START] Dragging available: ${draggedPokemon?.name} (ID: ${pokemonId})`);
      }
    } else {
      const pokemonId = parseId(activeId);
      if (pokemonId !== null) {
        draggedPokemon = localRankings.find(p => p.id === pokemonId);
        console.log(`🚀 [ENHANCED_DRAG_START] Dragging ranked: ${draggedPokemon?.name} (ID: ${pokemonId})`);
      }
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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
      const pokemonId = parseId(activeId);
      if (pokemonId === null) return;

      console.log(`🚀 [ENHANCED_DRAG_END] Available Pokemon ${pokemonId} dragged to ${overId}`);
      
      // FIXED: Accept both filled slots (ranking-X) and empty slots (ranking-position-X)
      const isValidDropTarget = (
        overId === 'rankings-drop-zone' ||
        overId === 'rankings-grid-drop-zone' ||
        overId.startsWith('ranking-') ||
        overId.startsWith('ranking-position-') ||
        over.data?.current?.type === 'ranking-position' ||
        over.data?.current?.type === 'ranked-pokemon' ||
        over.data?.current?.type === 'rankings-container' ||
        over.data?.current?.accepts?.includes('available-pokemon')
      );
      
      if (isValidDropTarget) {
        const pokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
        if (!pokemon) {
          console.error(`🚀 [ENHANCED_DRAG_END] Pokemon ${pokemonId} not found`);
          return;
        }

        console.log(`🚀 [ENHANCED_DRAG_END] Found pokemon: ${pokemon.name}, isRanked: ${pokemon.isRanked}`);
        
        if (pokemon.isRanked) {
          // Re-rank existing Pokemon
          console.log(`🔥 [RE_RANK_POKEMON] Re-ranking ${pokemon.name}`);
          if (triggerReRanking) {
            triggerReRanking(pokemonId).catch(console.error);
          }
        } else {
          // Add new Pokemon to rankings
          console.log(`🔥 [ADD_NEW_POKEMON] Adding ${pokemon.name} to rankings`);
          
          // Add to TrueSkill store
          const defaultRating = new Rating(25.0, 8.333);
          updateRating(pokemonId.toString(), defaultRating);
          
          // FIXED: Improved insertion position logic with proper ID handling
          let insertionPosition = localRankings.length;
          
          if (overId.startsWith('ranking-') && !overId.startsWith('ranking-position-')) {
            // Dropped on a filled slot - get the Pokemon ID
            const targetPokemonId = parseId(overId);
            if (targetPokemonId !== null) {
              const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
              if (targetIndex !== -1) {
                insertionPosition = targetIndex;
                console.log(`🔥 [ADD_NEW_POKEMON] Inserting before Pokemon ${targetPokemonId} at position ${targetIndex}`);
              }
            }
          } else if (overId.startsWith('ranking-position-')) {
            // Dropped on an empty slot - get the position index
            const slotIndex = parseId(overId);
            if (slotIndex !== null && slotIndex >= 0 && slotIndex <= localRankings.length) {
              insertionPosition = slotIndex;
              console.log(`🔥 [ADD_NEW_POKEMON] Inserting at empty slot position ${slotIndex}`);
            }
          }
          
          // Final fallback to over.data for insertion position
          if (over.data?.current?.index !== undefined && 
              (insertionPosition === localRankings.length || insertionPosition < 0)) {
            insertionPosition = over.data.current.index;
            console.log(`🔥 [ADD_NEW_POKEMON] Using fallback position from data: ${insertionPosition}`);
          }
          
          console.log(`🔥 [ADD_NEW_POKEMON] Final insertion position: ${insertionPosition}`);
          
          try {
            handleEnhancedManualReorder(pokemonId, -1, insertionPosition);
            console.log(`🔥 [ADD_NEW_POKEMON] Successfully added ${pokemon.name}`);
          } catch (error) {
            console.error(`🔥 [ADD_NEW_POKEMON] Failed to add Pokemon:`, error);
          }
        }
      } else {
        console.log(`🚀 [ENHANCED_DRAG_END] Invalid drop target`);
      }
      return;
    }

    // Handle reordering within rankings
    if (!activeId.startsWith('available-') && !overId.startsWith('available-')) {
      const activePokemonId = parseId(activeId);
      
      if (activePokemonId === null) {
        console.log(`🚀 [ENHANCED_DRAG_END] Invalid active Pokemon ID for reorder`);
        return;
      }

      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      let newIndex = -1;
      
      // FIXED: Handle both Pokemon-based drops and position-based drops
      if (overId.startsWith('ranking-') && !overId.startsWith('ranking-position-')) {
        // Dropped on another Pokemon
        const overPokemonId = parseId(overId);
        if (overPokemonId !== null) {
          newIndex = localRankings.findIndex(p => p.id === overPokemonId);
          console.log(`🚀 [ENHANCED_DRAG_END] Reordering to Pokemon ${overPokemonId} position`);
        }
      } else if (overId.startsWith('ranking-position-')) {
        // Dropped on an empty position
        const positionIndex = parseId(overId);
        if (positionIndex !== null && positionIndex >= 0 && positionIndex <= localRankings.length) {
          newIndex = Math.min(positionIndex, localRankings.length - 1); // Ensure we don't exceed bounds
          console.log(`🚀 [ENHANCED_DRAG_END] Reordering to position slot ${positionIndex} -> ${newIndex}`);
        }
      }
      
      // Fall back to using the droppable slot's index if nothing else worked
      if (newIndex === -1 && over.data?.current?.index !== undefined) {
        newIndex = Math.min(over.data.current.index, localRankings.length - 1);
        console.log(`🚀 [ENHANCED_DRAG_END] Using fallback index from data: ${newIndex}`);
      }
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🚀 [ENHANCED_DRAG_END] Reordering from ${oldIndex} to ${newIndex}`);
        try {
          handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
        } catch (error) {
          console.error(`🚀 [ENHANCED_DRAG_END] Reorder failed:`, error);
        }
      } else {
        console.log(`🚀 [ENHANCED_DRAG_END] No reorder needed: oldIndex=${oldIndex}, newIndex=${newIndex}`);
      }
    }
  }, [enhancedAvailablePokemon, localRankings, updateRating, handleEnhancedManualReorder, triggerReRanking]);

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🚀 [ENHANCED_MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    try {
      handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    } catch (error) {
      console.error(`🚀 [ENHANCED_MANUAL_REORDER] Failed:`, error);
    }
  }, [handleEnhancedManualReorder]);

  return {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
