
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
      
      // CRITICAL FIX: Accept any ranking- prefixed target as valid
      const isValidDropTarget = (
        overId === 'rankings-drop-zone' ||
        overId === 'rankings-grid-drop-zone' ||
        overId.startsWith('ranking-') ||
        overId.startsWith('ranking-position-') ||
        over.data?.current?.type === 'ranking-position' ||
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
          
          // CRITICAL FIX: Improved insertion position logic
          let insertionPosition = localRankings.length;
          
          if (overId.startsWith('ranking-')) {
            const targetPokemonId = parseId(overId);
            if (targetPokemonId !== null) {
              const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
              if (targetIndex !== -1) {
                insertionPosition = targetIndex;
              }
            }
          } else if (overId.startsWith('ranking-position-')) {
            // For empty slots, use the index from the ID or data
            const slotIndex = parseId(overId);
            if (slotIndex !== null && slotIndex >= 0 && slotIndex <= localRankings.length) {
              insertionPosition = slotIndex;
            }
          }
          
          // Fall back to over.data for insertion position
          if (over.data?.current?.index !== undefined) {
            insertionPosition = over.data.current.index;
          }
          
          console.log(`🔥 [ADD_NEW_POKEMON] Inserting at position ${insertionPosition}`);
          
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
      let overPokemonId = parseId(overId);
      
      if (activePokemonId === null) {
        console.log(`🚀 [ENHANCED_DRAG_END] Invalid active Pokemon ID for reorder`);
        return;
      }

      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      let newIndex = -1;
      
      // CRITICAL FIX: Handle both Pokémon IDs and position-based drops
      if (overPokemonId !== null) {
        newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      }
      
      // Fall back to using the droppable slot's index if Pokémon not found
      if (newIndex === -1 && over.data?.current?.index !== undefined) {
        newIndex = over.data.current.index;
      }
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🚀 [ENHANCED_DRAG_END] Reordering from ${oldIndex} to ${newIndex}`);
        try {
          handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
        } catch (error) {
          console.error(`🚀 [ENHANCED_DRAG_END] Reorder failed:`, error);
        }
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
