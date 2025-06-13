
import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent, useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { usePokemonMovement } from './usePokemonMovement';

export const useEnhancedRankingDragDrop = (
  enhancedAvailablePokemon: any[],
  localRankings: any[],
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  handleEnhancedManualReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void,
  triggerReRanking: (pokemonId: number) => Promise<void>,
  updateLocalRankings: (rankings: any[]) => void
) => {
  // Combine drag state into a single object to reduce re-renders
  const [dragState, setDragState] = useState<{
    activePokemon: any;
    sourceInfo: { fromAvailable: boolean; isRanked: boolean } | null;
    cardProps: any;
  }>({
    activePokemon: null,
    sourceInfo: null,
    cardProps: null,
  });

  // Use the atomic Pokemon movement hook
  const { moveFromAvailableToRankings } = usePokemonMovement(
    setAvailablePokemon,
    handleEnhancedManualReorder
  );

  // Optimized sensors for maximum responsiveness
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Reduced from 3 to 1 for more immediate response
        delay: 0,
        tolerance: 2,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 20, // Reduced from 50ms for better touch responsiveness
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    let sourceInfo = { fromAvailable: false, isRanked: false };
    let cardProps = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
      sourceInfo = { fromAvailable: true, isRanked: draggedPokemon?.isRanked || false };
      
      const index = enhancedAvailablePokemon.findIndex(p => p.id === pokemonId);
      cardProps = {
        pokemon: draggedPokemon,
        index: index,
        isPending: false,
        showRank: false,
        isDraggable: true,
        isAvailable: true,
        context: "available" as const
      };
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      sourceInfo = { fromAvailable: false, isRanked: true };
      
      const index = localRankings.findIndex(p => p.id === pokemonId);
      cardProps = {
        pokemon: draggedPokemon,
        index: index,
        isPending: false,
        showRank: true,
        isDraggable: true,
        isAvailable: false,
        context: "ranked" as const
      };
    }
    
    // Set all drag state in a single call to reduce re-renders
    setDragState({
      activePokemon: draggedPokemon,
      sourceInfo: sourceInfo,
      cardProps: cardProps,
    });
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setDragState({ activePokemon: null, sourceInfo: null, cardProps: null });
    
    const { active, over } = event;
    
    if (!over) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle drag from available to rankings with optimistic updates
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      
      const isValidDropTarget = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-grid-drop-zone' ||
        over.data?.current?.type === 'rankings-container' ||
        over.data?.current?.type === 'rankings-grid' ||
        over.data?.current?.accepts?.includes('available-pokemon') ||
        (!overId.startsWith('available-') && 
         !overId.startsWith('collision-placeholder-') &&
         !isNaN(parseInt(overId)) && 
         localRankings.some(p => p.id === parseInt(overId)))
      );
      
      if (isValidDropTarget) {
        const pokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
        if (pokemon) {
          const isActuallyInRankings = localRankings.some(p => p.id === pokemonId);
          
          let insertionPosition = localRankings.length;
          if (!overId.startsWith('available-') && 
              !overId.startsWith('collision-placeholder-') &&
              !isNaN(parseInt(overId))) {
            const targetPokemonId = parseInt(overId);
            const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
            if (targetIndex !== -1) {
              insertionPosition = targetIndex;
            }
          }

          if (isActuallyInRankings) {
            // OPTIMISTIC UI UPDATE: Update visual state immediately
            const currentIndex = localRankings.findIndex(p => p.id === pokemonId);
            const newRankings = arrayMove(localRankings, currentIndex, insertionPosition);
            updateLocalRankings(newRankings);
            
            // ASYNCHRONOUS CALCULATION: Update TrueSkill in background
            setTimeout(() => {
              handleEnhancedManualReorder(pokemonId, currentIndex, insertionPosition);
            }, 0);
          } else {
            // OPTIMISTIC UI UPDATE: Add to rankings immediately
            const newRankings = [...localRankings];
            newRankings.splice(insertionPosition, 0, {
              ...pokemon,
              score: 25.0,
              rank: insertionPosition + 1
            });
            updateLocalRankings(newRankings);
            
            // BACKGROUND OPERATION: Move from available (includes TrueSkill update)
            setTimeout(() => {
              moveFromAvailableToRankings(pokemonId, insertionPosition, pokemon);
            }, 0);
          }
          
          return;
        }
      }
      return;
    }

    // Handle reordering within rankings with optimistic updates
    if (!activeId.startsWith('available-') && !overId.startsWith('available-') && !overId.startsWith('collision-placeholder-')) {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`%cDragEnd: moving from index ${oldIndex} to ${newIndex}`, 'color: green');
        
        // OPTIMISTIC UI UPDATE: Reorder visually immediately using arrayMove
        const newOrder = arrayMove(localRankings, oldIndex, newIndex);
        console.log('%cOptimistic newOrder:', 'color: green', newOrder);
        updateLocalRankings(newOrder);
        
        // ASYNCHRONOUS CALCULATION: Update TrueSkill scores in background
        setTimeout(() => {
          console.log(`%cExecuting TrueSkill calculation for Pokemon ${activePokemonId}`, 'color: purple');
          handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
        }, 0);
      }
    }
  }, [enhancedAvailablePokemon, localRankings, handleEnhancedManualReorder, triggerReRanking, moveFromAvailableToRankings, updateLocalRankings]);

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    // For manual reorder calls, use immediate update (no setTimeout)
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  return {
    sensors,
    activeDraggedPokemon: dragState.activePokemon,
    dragSourceInfo: dragState.sourceInfo,
    sourceCardProps: dragState.cardProps,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
