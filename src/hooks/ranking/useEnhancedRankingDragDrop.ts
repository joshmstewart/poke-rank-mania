
import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useNewPokemonAddition } from "./useNewPokemonAddition";
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
  const { getRating } = useTrueSkillStore();

  // Use the new clean Pokemon addition hook
  const { addNewPokemonToRankings } = useNewPokemonAddition(localRankings, updateLocalRankings);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] ===== ENHANCED DRAG START =====`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Active ID: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Dragging available: ${draggedPokemon?.name} (ID: ${pokemonId})`);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Is already ranked: ${draggedPokemon?.isRanked}`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Dragging ranked: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ===== ENHANCED DRAG END =====`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    
    setActiveDraggedPokemon(null);
    
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
          console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Is already ranked: ${pokemon.isRanked}`);
          
          if (pokemon.isRanked) {
            // CASE A: Pokemon is already ranked - trigger re-ranking
            console.log(`🔥🔥🔥 [RE_RANK_POKEMON] ===== RE-RANKING EXISTING POKEMON =====`);
            console.log(`🔥🔥🔥 [RE_RANK_POKEMON] Pokemon ${pokemonId} (${pokemon.name}) currently at rank ${pokemon.currentRank}`);
            
            try {
              toast({
                title: "Re-ranking Pokemon",
                description: `Triggering new battles for ${pokemon.name} (currently rank #${pokemon.currentRank})`,
                duration: 3000
              });
              
              // Trigger re-ranking process
              await triggerReRanking(pokemonId);
              
              console.log(`🔥🔥🔥 [RE_RANK_POKEMON] ✅ Re-ranking completed for ${pokemon.name}`);
              
              toast({
                title: "Re-ranking Complete",
                description: `${pokemon.name} has been re-ranked based on new battles!`,
                duration: 3000
              });
              
            } catch (error) {
              console.error(`🔥🔥🔥 [RE_RANK_POKEMON] ❌ Re-ranking failed:`, error);
              toast({
                title: "Re-ranking Failed",
                description: `Failed to re-rank ${pokemon.name}. Please try again.`,
                variant: "destructive",
                duration: 3000
              });
            }
            
          } else {
            // CASE B: Pokemon is not ranked - use the clean new addition system
            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] ===== ADDING NEW POKEMON =====`);
            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] Pokemon ${pokemonId} (${pokemon.name}) - first time ranking`);
            
            // Determine insertion position
            let insertionPosition = localRankings.length;
            if (!overId.startsWith('available-') && 
                !overId.startsWith('collision-placeholder-') &&
                !isNaN(parseInt(overId))) {
              const targetPokemonId = parseInt(overId);
              const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
              if (targetIndex !== -1) {
                insertionPosition = targetIndex;
                console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] ✅ Will insert at position ${targetIndex}`);
              }
            }

            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] Using clean addition system for position ${insertionPosition}`);
            
            // Use the clean, separate addition function
            addNewPokemonToRankings(pokemonId, insertionPosition);
            
            toast({
                title: "Pokemon Added",
                description: `${pokemon.name} has been added to rankings at the dropped position!`,
                duration: 3000
            });
            
            console.log(`🌟🌟🌟 [ADD_NEW_POKEMON] ✅ Addition process completed using clean system`);
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

    // Handle reordering within rankings (existing logic)
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
  }, [enhancedAvailablePokemon, localRankings, handleEnhancedManualReorder, triggerReRanking, addNewPokemonToRankings, getRating]);

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
    handleDragStart,
    handleDragEnd,
    handleManualReorder
  };
};
