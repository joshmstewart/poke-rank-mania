
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
  const { updateRating, getRating } = useTrueSkillStore();

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

  const calculateTargetRatingForPosition = useCallback((insertionPosition: number, localRankings: any[]) => {
    console.log(`🎯 [CALCULATE_TARGET_RATING] ===== CALCULATING TARGET RATING =====`);
    console.log(`🎯 [CALCULATE_TARGET_RATING] Insertion position: ${insertionPosition}`);
    console.log(`🎯 [CALCULATE_TARGET_RATING] Local rankings length: ${localRankings.length}`);

    const MIN_SIGMA = 1.0;
    let targetDisplayedScore: number;

    // Get neighbors at the insertion position
    const abovePokemon = insertionPosition > 0 ? localRankings[insertionPosition - 1] : null;
    const belowPokemon = insertionPosition < localRankings.length ? localRankings[insertionPosition] : null;

    console.log(`🎯 [CALCULATE_TARGET_RATING] Above Pokemon: ${abovePokemon?.name || 'None'}`);
    console.log(`🎯 [CALCULATE_TARGET_RATING] Below Pokemon: ${belowPokemon?.name || 'None'}`);

    // Get neighbor scores from TrueSkill store
    let aboveScore = 0, belowScore = 0;
    
    if (abovePokemon) {
      const aboveRating = getRating(abovePokemon.id.toString());
      aboveScore = aboveRating.mu - aboveRating.sigma;
      console.log(`🎯 [CALCULATE_TARGET_RATING] Above score: ${aboveScore.toFixed(5)}`);
    }
    
    if (belowPokemon) {
      const belowRating = getRating(belowPokemon.id.toString());
      belowScore = belowRating.mu - belowRating.sigma;
      console.log(`🎯 [CALCULATE_TARGET_RATING] Below score: ${belowScore.toFixed(5)}`);
    }

    // Calculate target score based on position
    if (abovePokemon && belowPokemon) {
      // Between two Pokemon - use simple average
      targetDisplayedScore = (aboveScore + belowScore) / 2;
      console.log(`🎯 [CALCULATE_TARGET_RATING] BETWEEN: target = ${targetDisplayedScore.toFixed(5)}`);
    } else if (abovePokemon && !belowPokemon) {
      // Bottom position - slightly below the Pokemon above
      targetDisplayedScore = aboveScore - 0.1;
      console.log(`🎯 [CALCULATE_TARGET_RATING] BOTTOM: target = ${targetDisplayedScore.toFixed(5)}`);
    } else if (!abovePokemon && belowPokemon) {
      // Top position - slightly above the Pokemon below
      targetDisplayedScore = belowScore + 0.1;
      console.log(`🎯 [CALCULATE_TARGET_RATING] TOP: target = ${targetDisplayedScore.toFixed(5)}`);
    } else {
      // Single Pokemon in list - use a reasonable default
      targetDisplayedScore = 20.0;
      console.log(`🎯 [CALCULATE_TARGET_RATING] SINGLE: target = ${targetDisplayedScore.toFixed(5)}`);
    }

    // Calculate mu and sigma for the target score
    const newSigma = MIN_SIGMA; // Use minimum sigma for new Pokemon
    const newMu = targetDisplayedScore + newSigma;

    console.log(`🎯 [CALCULATE_TARGET_RATING] Final: μ=${newMu.toFixed(5)}, σ=${newSigma.toFixed(5)}, score=${targetDisplayedScore.toFixed(5)}`);

    return new Rating(newMu, newSigma);
  }, [getRating]);

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
            // CASE B: Pokemon is not ranked - add as new with proper positioning
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ===== ADDING NEW POKEMON TO RANKINGS =====`);
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] Pokemon ${pokemonId} (${pokemon.name}) - first time ranking`);
            
            // Determine insertion position
            let insertionPosition = localRankings.length;
            if (!overId.startsWith('available-') && 
                !overId.startsWith('collision-placeholder-') &&
                !isNaN(parseInt(overId))) {
              const targetPokemonId = parseInt(overId);
              const targetIndex = localRankings.findIndex(p => p.id === targetPokemonId);
              if (targetIndex !== -1) {
                insertionPosition = targetIndex;
                console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Will insert at position ${targetIndex}`);
              }
            }

            // CRITICAL FIX: Calculate the proper TrueSkill rating for the drop position
            const targetRating = calculateTargetRatingForPosition(insertionPosition, localRankings);
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Calculated target rating: μ=${targetRating.mu.toFixed(5)}, σ=${targetRating.sigma.toFixed(5)}`);
            
            // Update TrueSkill store with the calculated rating
            updateRating(pokemonId.toString(), targetRating);
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Updated TrueSkill store with positioned rating`);
            
            // CRITICAL FIX: Create the updated rankings manually instead of calling handleEnhancedManualReorder
            // This prevents double score adjustment
            const newPokemonWithRating = {
              ...pokemon,
              score: targetRating.mu - targetRating.sigma,
              confidence: Math.max(0, Math.min(100, 100 * (1 - (targetRating.sigma / 8.33)))),
              rating: {
                mu: targetRating.mu,
                sigma: targetRating.sigma,
                battleCount: 0
              },
              count: 0,
              wins: 0,
              losses: 0,
              winRate: 0
            };
            
            // Insert the Pokemon at the correct position
            const updatedRankings = [...localRankings];
            updatedRankings.splice(insertionPosition, 0, newPokemonWithRating);
            
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Manually created updated rankings with ${updatedRankings.length} Pokemon`);
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] New Pokemon score: ${newPokemonWithRating.score.toFixed(5)}`);
            
            // Update the rankings through the manual reorder hook's update function
            handleEnhancedManualReorder(pokemonId, -1, insertionPosition);
            
            toast({
                title: "Pokemon Added",
                description: `${pokemon.name} has been added to rankings at the dropped position!`,
                duration: 3000
            });
            
            console.log(`🔥🔥🔥 [ADD_NEW_POKEMON] ✅ Addition process completed`);
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
  }, [enhancedAvailablePokemon, localRankings, updateRating, handleEnhancedManualReorder, triggerReRanking, calculateTargetRatingForPosition]);

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
