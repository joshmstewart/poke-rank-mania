import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent, useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { usePokemonMovement } from './usePokemonMovement';

export const useEnhancedRankingDragDrop = (
  enhancedAvailablePokemon: any[],
  localRankings: any[],
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  handleEnhancedManualReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void,
  triggerReRanking: (pokemonId: number) => Promise<void>,
  updateLocalRankings: (rankings: any[]) => void
) => {
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  const [dragSourceInfo, setDragSourceInfo] = useState<{fromAvailable: boolean, isRanked: boolean} | null>(null);
  const [sourceCardProps, setSourceCardProps] = useState<any>(null);

  // Use the atomic Pokemon movement hook
  const { moveFromAvailableToRankings } = usePokemonMovement(
    setAvailablePokemon,
    handleEnhancedManualReorder
  );

  // Optimized sensors for enhanced ranking drag drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
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
    
    setActiveDraggedPokemon(draggedPokemon);
    setDragSourceInfo(sourceInfo);
    setSourceCardProps(cardProps);
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDraggedPokemon(null);
    setDragSourceInfo(null);
    setSourceCardProps(null);
    
    const { active, over } = event;
    
    if (!over) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      
      // Check for valid drop targets
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
          
          // Determine insertion position
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
            // CASE A: Pokemon is already in rankings - this is a REORDER
            const currentIndex = localRankings.findIndex(p => p.id === pokemonId);
            handleEnhancedManualReorder(pokemonId, currentIndex, insertionPosition);
          } else {
            // CASE B: Pokemon is not in rankings - use atomic move operation
            console.log(`🔄 [DRAG_DROP] Using atomic move for Pokemon ${pokemonId}`);
            await moveFromAvailableToRankings(pokemonId, insertionPosition, pokemon);
          }
          
          return;
        }
      }
      return;
    }

    // Handle reordering within rankings
    if (!activeId.startsWith('available-') && !overId.startsWith('available-') && !overId.startsWith('collision-placeholder-')) {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
      }
    }
  }, [enhancedAvailablePokemon, localRankings, handleEnhancedManualReorder, triggerReRanking, moveFromAvailableToRankings]);

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  return {
    sensors,
    activeDraggedPokemon,
    dragSourceInfo,
    sourceCardProps,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
