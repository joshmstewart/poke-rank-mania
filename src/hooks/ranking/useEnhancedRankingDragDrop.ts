import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent, useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { Rating } from "ts-trueskill";
import { toast } from "@/hooks/use-toast";

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
  const { updateRating, getAllRatings, forceScoreBetweenNeighbors } = useTrueSkillStore();

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
    console.log(`🐛 [DRAG_DEBUG] ===== DRAG START =====`);
    const activeId = event.active.id.toString();
    console.log(`🐛 [DRAG_DEBUG] Active ID: ${activeId}`);
    
    let draggedPokemon = null;
    let sourceInfo = { fromAvailable: false, isRanked: false };
    let cardProps = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
      sourceInfo = { fromAvailable: true, isRanked: draggedPokemon?.isRanked || false };
      
      console.log(`🐛 [DRAG_DEBUG] Dragging from available - Pokemon ${pokemonId}, isRanked: ${draggedPokemon?.isRanked}`);
      
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
      
      console.log(`🐛 [DRAG_DEBUG] Dragging from rankings - Pokemon ${pokemonId}`);
      if (draggedPokemon) {
        console.log(`🐛 [DRAG_DEBUG] Current score before drag: ${draggedPokemon.score}`);
      }
      
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
    
    console.log(`🐛 [DRAG_DEBUG] Drag start complete for Pokemon: ${draggedPokemon?.name || 'Unknown'}`);
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    console.log(`🐛 [DRAG_DEBUG] ===== DRAG END =====`);
    
    setActiveDraggedPokemon(null);
    setDragSourceInfo(null);
    setSourceCardProps(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🐛 [DRAG_DEBUG] No drop target - exiting`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    console.log(`🐛 [DRAG_DEBUG] Active ID: ${activeId}, Over ID: ${overId}`);

    const handleReorder = (pokemonId: number, oldIndex: number, newIndex: number) => {
        console.log(`🐛 [DRAG_DEBUG] REORDER: Pokemon ${pokemonId} from ${oldIndex} to ${newIndex}`);

        // 1. Create the new array with the pokemon moved.
        const newLocalRankings = [...localRankings];
        const [draggedItem] = newLocalRankings.splice(oldIndex, 1);
        newLocalRankings.splice(newIndex, 0, draggedItem);

        // 2. Determine neighbors from the new array.
        const higherNeighborId = newLocalRankings[newIndex - 1]?.id.toString();
        const lowerNeighborId = newLocalRankings[newIndex + 1]?.id.toString();

        // 3. Persist the score change to the global store in the background
        forceScoreBetweenNeighbors(pokemonId.toString(), higherNeighborId, lowerNeighborId);

        // 4. Calculate the new score locally to prevent async issues
        const allRatings = getAllRatings();
        const higherNeighborScore = higherNeighborId ? allRatings[higherNeighborId]?.mu : undefined;
        const lowerNeighborScore = lowerNeighborId ? allRatings[lowerNeighborId]?.mu : undefined;
        
        let targetScore: number;
        if (higherNeighborScore !== undefined && lowerNeighborScore !== undefined) {
          targetScore = (higherNeighborScore + lowerNeighborScore) / 2;
        } else if (higherNeighborScore !== undefined) {
          // Using the same logic as the store for consistency
          targetScore = higherNeighborScore + 1.0;
        } else if (lowerNeighborScore !== undefined) {
          targetScore = lowerNeighborScore - 1.0;
        } else {
          targetScore = 25.0; // Default TrueSkill rating
        }

        console.log(`🐛 [DRAG_DEBUG] Locally calculated new score for ${pokemonId}: ${targetScore}`);

        // 5. Update the score on the item that was moved in our new local array.
        newLocalRankings[newIndex] = {
            ...newLocalRankings[newIndex],
            score: targetScore,
        };
        
        // 6. Update the component's state with this new, correct array.
        updateLocalRankings(newLocalRankings);
        
        toast({
          title: "Pokemon Reordered",
          description: `${newLocalRankings[newIndex].name} moved to position ${newIndex + 1}!`,
          duration: 3000
        });
    };

    // Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🐛 [DRAG_DEBUG] Processing available Pokemon ${pokemonId} drop`);
      
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
      
      console.log(`🐛 [DRAG_DEBUG] Valid drop target: ${isValidDropTarget}`);
      
      if (isValidDropTarget) {
        const pokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
        if (pokemon) {
          const isActuallyInRankings = localRankings.some(p => p.id === pokemonId);
          console.log(`🐛 [DRAG_DEBUG] Pokemon ${pokemonId} already in rankings: ${isActuallyInRankings}`);
          
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
          
          console.log(`🐛 [DRAG_DEBUG] Insertion position: ${insertionPosition}`);

          if (isActuallyInRankings) {
            // CASE A: Pokemon is already in rankings - this is a REORDER
            const currentIndex = localRankings.findIndex(p => p.id === pokemonId);
            console.log(`🐛 [DRAG_DEBUG] REORDER: Moving from position ${currentIndex} to ${insertionPosition}`);
            handleReorder(pokemonId, currentIndex, insertionPosition);
          } else {
            // CASE B: Pokemon is not in rankings - add as new
            console.log(`🐛 [DRAG_DEBUG] ADD NEW: Adding Pokemon ${pokemonId} at position ${insertionPosition}`);
            
            // Add default rating to TrueSkill store if it doesn't exist
            const defaultRating = new Rating(25.0, 8.333);
            updateRating(pokemonId.toString(), defaultRating);
            
            console.log(`🐛 [DRAG_DEBUG] Added default rating: mu=${defaultRating.mu}, sigma=${defaultRating.sigma}`);
            
            // Remove from available list BEFORE calling the reorder to prevent bounce-back
            setAvailablePokemon(prev => prev.filter(p => p.id !== pokemonId));
            
            // Use a small delay to ensure the removal is processed before the reorder
            setTimeout(() => {
              console.log(`🐛 [DRAG_DEBUG] Calling handleEnhancedManualReorder for new Pokemon`);
              handleEnhancedManualReorder(pokemonId, -1, insertionPosition);
              
              // Log the result after another delay
              setTimeout(() => {
                const allRatings = getAllRatings();
                const newRating = allRatings[pokemonId.toString()];
                console.log(`🐛 [DRAG_DEBUG] New Pokemon rating after add: ${newRating?.mu || 'Not found'}`);
              }, 100);
            }, 10);
            
            toast({
                title: "Pokemon Added",
                description: `${pokemon.name} has been added to rankings at position ${insertionPosition + 1}!`,
                duration: 3000
            });
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
      
      console.log(`🐛 [DRAG_DEBUG] RANKING REORDER: ${activePokemonId} to ${overPokemonId} position`);
      
      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      
      console.log(`🐛 [DRAG_DEBUG] Old index: ${oldIndex}, New index: ${newIndex}`);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        handleReorder(activePokemonId, oldIndex, newIndex);
      }
    }
  }, [enhancedAvailablePokemon, localRankings, handleEnhancedManualReorder, triggerReRanking, updateRating, setAvailablePokemon, getAllRatings, forceScoreBetweenNeighbors, updateLocalRankings]);

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🐛 [DRAG_DEBUG] ===== MANUAL REORDER CALLED =====`);
    console.log(`🐛 [DRAG_DEBUG] Pokemon ${draggedPokemonId}: ${sourceIndex} → ${destinationIndex}`);
    
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
