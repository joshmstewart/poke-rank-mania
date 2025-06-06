
import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
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
  const { updateRating } = useTrueSkillStore();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] ===== ENHANCED DRAG START =====`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Active ID: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    let sourceInfo = { fromAvailable: false, isRanked: false };
    let cardProps = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
      sourceInfo = { fromAvailable: true, isRanked: draggedPokemon?.isRanked || false };
      
      // Capture exact props used in available section
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
      
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Dragging from available: ${draggedPokemon?.name} (ID: ${pokemonId})`);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Is already ranked: ${draggedPokemon?.isRanked}`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      sourceInfo = { fromAvailable: false, isRanked: true };
      
      // Capture exact props used in rankings section (via DragDropGrid)
      const index = localRankings.findIndex(p => p.id === pokemonId);
      cardProps = {
        pokemon: draggedPokemon,
        index: index,
        isPending: false, // DragDropGrid uses localPendingRefinements.has(pokemon.id)
        showRank: true,
        isDraggable: true,
        isAvailable: false,
        context: "ranked" as const
      };
      
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Dragging from rankings: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
    setDragSourceInfo(sourceInfo);
    setSourceCardProps(cardProps);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Source info:`, sourceInfo);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Source card props:`, cardProps);
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ===== ENHANCED DRAG END =====`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    setActiveDraggedPokemon(null);
    setDragSourceInfo(null);
    setSourceCardProps(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ❌ No drop target`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Available Pokemon ${pokemonId} dragged to ${overId}`);
      
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
      
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Drop target validation: ${isValidDropTarget}`);
      
      if (isValidDropTarget) {
        const pokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
        if (pokemon) {
          console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ Found pokemon: ${pokemon.name}`);
          
          // Check if Pokemon is actually in the current rankings
          const isActuallyInRankings = localRankings.some(p => p.id === pokemonId);
          console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Is actually in current rankings: ${isActuallyInRankings}`);
          console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] pokemon.isRanked flag: ${pokemon.isRanked}`);
          
          // Determine insertion position
          let insertionPosition = localRankings.length;
          if (!overId.startsWith('available-') && 
              !overId.startsWith('collision-placeholder-') &&
              !isNaN(parseInt(overId))) {
            const targetPokemonId = parseInt(overId);
            const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
            if (targetIndex !== -1) {
              insertionPosition = targetIndex;
              console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ Will insert at position ${targetIndex}`);
            }
          }

          if (isActuallyInRankings) {
            // CASE A: Pokemon is already in rankings - this is a REORDER, not re-ranking
            console.log(`🔥🔥🔥 [REORDER_EXISTING_POKEMON] ===== REORDERING EXISTING POKEMON =====`);
            console.log(`🔥🔥🔥 [REORDER_EXISTING_POKEMON] Pokemon ${pokemonId} (${pokemon.name}) moving to position ${insertionPosition}`);
            
            const currentIndex = localRankings.findIndex(p => p.id === pokemonId);
            
            // This is a reorder within rankings - use manual reorder
            handleEnhancedManualReorder(pokemonId, currentIndex, insertionPosition);
            
            toast({
              title: "Pokemon Reordered",
              description: `${pokemon.name} moved to position ${insertionPosition + 1}!`,
              duration: 3000
            });
            
          } else {
            // CASE B: Pokemon is not in rankings - add as new
            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] ===== ADDING NEW POKEMON =====`);
            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] Pokemon ${pokemonId} (${pokemon.name}) - adding to rankings`);
            
            // Add default rating to TrueSkill store if it doesn't exist
            const defaultRating = new Rating(25.0, 8.333);
            updateRating(pokemonId.toString(), defaultRating);
            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] ✅ Added/updated rating in TrueSkill store`);
            
            // Remove from available list
            setAvailablePokemon(prev => prev.filter(p => p.id !== pokemonId));
            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] ✅ Removed from available list`);
            
            // Use the enhanced manual reorder function with -1 source index
            // to indicate this is a new addition, not a reorder
            handleEnhancedManualReorder(pokemonId, -1, insertionPosition);
            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] ✅ Called handleEnhancedManualReorder with -1 source index`);
            
            toast({
                title: "Pokemon Added",
                description: `${pokemon.name} has been added to rankings at position ${insertionPosition + 1}!`,
                duration: 3000
            });
            
            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] ✅ Addition process completed`);
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
    if (!activeId.startsWith('available-') && !overId.startsWith('available-') && !overId.startsWith('collision-placeholder-')) {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ Reordering from ${oldIndex} to ${newIndex}`);
        handleEnhancedManualReorder(activePokemonId, oldIndex, newIndex);
      }
    }
  }, [enhancedAvailablePokemon, localRankings, handleEnhancedManualReorder, triggerReRanking, updateRating, setAvailablePokemon]);

  const handleManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`🚀🚀🚀 [ENHANCED_MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  }, [handleEnhancedManualReorder]);

  return {
    activeDraggedPokemon,
    dragSourceInfo,
    sourceCardProps,
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
