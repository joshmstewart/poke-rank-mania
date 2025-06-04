
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
  triggerReRanking: (pokemonId: number) => Promise<void>
) => {
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  const { updateRating } = useTrueSkillStore();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] ===== ENHANCED DRAG START =====`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Active ID: ${event.active.id}`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] enhancedAvailablePokemon count: ${enhancedAvailablePokemon.length}`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] localRankings count: ${localRankings.length}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Dragging available: ${draggedPokemon?.name} (ID: ${pokemonId})`);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Is already ranked: ${draggedPokemon?.isRanked}`);
    } else if (activeId.startsWith('ranking-')) {
      const pokemonId = parseInt(activeId.replace('ranking-', ''));
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Dragging ranked: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] Dragging legacy format: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_START] ✅ Drag start completed`);
  }, [enhancedAvailablePokemon, localRankings]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ===== ENHANCED DRAG END START =====`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Active: ${event.active.id}, Over: ${event.over?.id || 'NULL'}`);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Over data:`, event.over?.data?.current);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] handleEnhancedManualReorder type:`, typeof handleEnhancedManualReorder);
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] triggerReRanking type:`, typeof triggerReRanking);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ❌ No drop target - ending`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Add explicit logging for validation
    console.log(`🎯 [VALIDATION_DEBUG] Dragging item: ${activeId} over target: ${overId}`);

    // Handle drag from available to rankings
    if (activeId.startsWith('available-')) {
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] === PROCESSING AVAILABLE POKEMON DROP ===`);
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Available Pokemon ${pokemonId} dragged to ${overId}`);
      
      // CRITICAL FIX: Enhanced validation logic with explicit accepts check
      const isValidDropTarget = (
        overId === 'rankings-drop-zone' || 
        overId === 'rankings-grid-drop-zone' ||
        over.data?.current?.type === 'rankings-container' ||
        over.data?.current?.type === 'rankings-grid' ||
        over.data?.current?.accepts?.includes('available-pokemon') ||
        (overId.startsWith('ranking-') && 
         !isNaN(parseInt(overId.replace('ranking-', ''))) && 
         localRankings.some(p => p.id === parseInt(overId.replace('ranking-', '')))) ||
        (!overId.startsWith('available-') && 
         !overId.startsWith('collision-placeholder-') &&
         !isNaN(parseInt(overId)) && 
         localRankings.some(p => p.id === parseInt(overId)))
      );
      
      console.log(`🎯 [VALIDATION_DEBUG] Drop target validation: ${isValidDropTarget}`);
      console.log(`🎯 [VALIDATION_DEBUG] Drop target details:`, {
        overId,
        isRankingsDropZone: overId === 'rankings-drop-zone',
        isRankingsGridDropZone: overId === 'rankings-grid-drop-zone',
        overDataType: over.data?.current?.type,
        overDataAccepts: over.data?.current?.accepts,
        acceptsAvailablePokemon: over.data?.current?.accepts?.includes('available-pokemon'),
        isRankingId: overId.startsWith('ranking-'),
        isNumericId: !isNaN(parseInt(overId)),
        foundInLocalRankings: localRankings.some(p => p.id === parseInt(overId))
      });
      
      if (isValidDropTarget) {
        console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ VALID DROP TARGET`);
        const pokemon = enhancedAvailablePokemon.find(p => p.id === pokemonId);
        if (pokemon) {
          console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ Found pokemon: ${pokemon.name}`);
          console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] Is already ranked: ${pokemon.isRanked}`);
          
          if (pokemon.isRanked) {
            console.log(`🔥🔥🔥 [RE_RANK_POKEMON] ===== RE-RANKING EXISTING POKEMON =====`);
            console.log(`🔥🔥🔥 [RE_RANK_POKEMON] triggerReRanking function available:`, !!triggerReRanking);
            
            if (triggerReRanking) {
              try {
                console.log(`🔥🔥🔥 [RE_RANK_POKEMON] Calling triggerReRanking for ${pokemonId}`);
                triggerReRanking(pokemonId).then(() => {
                  console.log(`🔥🔥🔥 [RE_RANK_POKEMON] ✅ Re-ranking completed for ${pokemon.name}`);
                }).catch((error) => {
                  console.error(`🔥🔥🔥 [RE_RANK_POKEMON] ❌ Re-ranking failed:`, error);
                });
              } catch (error) {
                console.error(`🔥🔥🔥 [RE_RANK_POKEMON] ❌ Sync re-ranking failed:`, error);
              }
            } else {
              console.error(`🔥🔥🔥 [RE_RANK_POKEMON] ❌ triggerReRanking function not available`);
            }
            
          } else {
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ===== ADDING NEW POKEMON TO RANKINGS =====`);
            
            // Add to TrueSkill store
            const defaultRating = new Rating(25.0, 8.333);
            updateRating(pokemonId.toString(), defaultRating);
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Added rating to TrueSkill store for ${pokemonId}`);
            
            // Determine insertion position
            let insertionPosition = localRankings.length;
            if (overId.startsWith('ranking-')) {
              const targetPokemonId = parseInt(overId.replace('ranking-', ''));
              const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
              if (targetIndex !== -1) {
                insertionPosition = targetIndex;
                console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Will insert at position ${targetIndex} (ranking- format)`);
              }
            } else if (!overId.startsWith('available-') && 
                      !overId.startsWith('collision-placeholder-') &&
                      !isNaN(parseInt(overId))) {
              const targetPokemonId = parseInt(overId);
              const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
              if (targetIndex !== -1) {
                insertionPosition = targetIndex;
                console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Will insert at position ${targetIndex} (legacy format)`);
              }
            }
            
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] Calling handleEnhancedManualReorder(${pokemonId}, -1, ${insertionPosition})`);
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] handleEnhancedManualReorder function:`, handleEnhancedManualReorder);
            
            try {
              handleEnhancedManualReorder(pokemonId, -1, insertionPosition);
              console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ handleEnhancedManualReorder completed`);
            } catch (error) {
              console.error(`🔥🔥🔥 [ADD_NEW_POKEMON] ❌ handleEnhancedManualReorder failed:`, error);
            }
            
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Addition process completed`);
          }
          
          console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ Processing completed for available Pokemon`);
          return;
        } else {
          console.error(`🚀🚀🚀 [ENHANCED_DRAG_END] ❌ Pokemon ${pokemonId} not found in available list!`);
        }
      } else {
        console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ❌ Invalid drop target - ignoring`);
      }
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ✅ Available Pokemon processing completed`);
      return;
    }

    // Handle reordering within rankings (existing logic)
    if ((activeId.startsWith('ranking-') || !activeId.startsWith('available-')) && 
        (overId.startsWith('ranking-') || (!overId.startsWith('available-') && !overId.startsWith('collision-placeholder-')))) {
      console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] === PROCESSING RANKING REORDER ===`);
      
      const activePokemonId = activeId.startsWith('ranking-') ? 
        parseInt(activeId.replace('ranking-', '')) : 
        parseInt(activeId);
      const overPokemonId = overId.startsWith('ranking-') ? 
        parseInt(overId.replace('ranking-', '')) : 
        parseInt(overId);
      
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
      } else {
        console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ❌ Invalid indices for reorder`);
      }
    }
    
    console.log(`🚀🚀🚀 [ENHANCED_DRAG_END] ===== ENHANCED DRAG END COMPLETE =====`);
  }, [enhancedAvailablePokemon, localRankings, updateRating, handleEnhancedManualReorder, triggerReRanking]);

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
