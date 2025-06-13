
import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent, useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';

export const useOptimizedDragDrop = (
  enhancedAvailablePokemon: any[],
  localRankings: any[],
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>,
  updateLocalRankings: (rankings: any[]) => void,
  onBackgroundReorder: (pokemonId: number, sourceIndex: number, destinationIndex: number) => void
) => {
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  const [dragSourceInfo, setDragSourceInfo] = useState<{fromAvailable: boolean, isRanked: boolean} | null>(null);

  // Ultra-responsive sensors - minimal activation distance
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Reduced from 3px to 1px for instant response
        delay: 0,
        tolerance: 1,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 25, // Reduced from 50ms to 25ms
        tolerance: 3,
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
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
      sourceInfo = { fromAvailable: true, isRanked: draggedPokemon?.isRanked || false };
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      sourceInfo = { fromAvailable: false, isRanked: true };
    }
    
    setActiveDraggedPokemon(draggedPokemon);
    setDragSourceInfo(sourceInfo);
  }, [enhancedAvailablePokemon, localRankings]);

  // Optimistic UI update function - runs immediately
  const performOptimisticUpdate = useCallback((
    activeId: string,
    overId: string,
    over: any
  ) => {
    // Handle drag from available to rankings
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
            // Instant reorder within rankings
            const currentIndex = localRankings.findIndex(p => p.id === pokemonId);
            const newRankings = arrayMove(localRankings, currentIndex, insertionPosition);
            updateLocalRankings(newRankings);
            
            // Schedule background TrueSkill update
            setTimeout(() => {
              onBackgroundReorder(pokemonId, currentIndex, insertionPosition);
            }, 0);
          } else {
            // Instant move from available to rankings
            const newRankings = [...localRankings];
            newRankings.splice(insertionPosition, 0, {
              ...pokemon,
              score: 25.0, // Temporary score for immediate display
              rank: insertionPosition + 1
            });
            updateLocalRankings(newRankings);
            
            // Remove from available list immediately
            setAvailablePokemon(prev => prev.filter(p => p.id !== pokemonId));
            
            // Schedule background TrueSkill update
            setTimeout(() => {
              onBackgroundReorder(pokemonId, -1, insertionPosition);
            }, 0);
          }
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
        // Instant visual reorder
        const newRankings = arrayMove(localRankings, oldIndex, newIndex);
        updateLocalRankings(newRankings);
        
        // Schedule background TrueSkill update
        setTimeout(() => {
          onBackgroundReorder(activePokemonId, oldIndex, newIndex);
        }, 0);
      }
    }
  }, [enhancedAvailablePokemon, localRankings, updateLocalRankings, setAvailablePokemon, onBackgroundReorder]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDraggedPokemon(null);
    setDragSourceInfo(null);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Perform optimistic update immediately
    performOptimisticUpdate(activeId, overId, over);
  }, [performOptimisticUpdate]);

  return {
    sensors,
    activeDraggedPokemon,
    dragSourceInfo,
    handleDragStart,
    handleDragEnd
  };
};
