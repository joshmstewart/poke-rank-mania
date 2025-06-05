
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from '@/services/pokemon';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { Rating } from 'ts-trueskill';

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (newRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean,
  addImpliedBattle?: (winnerId: number, loserId: number) => void
) => {
  const { updateRating, getRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] ===== HOOK INITIALIZATION =====');
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] finalRankings length:', finalRankings.length);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] preventAutoResorting:', preventAutoResorting);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] Manual mode active:', preventAutoResorting);

  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>(finalRankings);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPokemonId, setDraggedPokemonId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [manualAdjustmentInProgress, setManualAdjustmentInProgress] = useState(false);

  // Update local rankings when final rankings change (but not during drag or manual adjustment)
  useEffect(() => {
    if (!isDragging && !isUpdating && !manualAdjustmentInProgress) {
      console.log('🔥 [ENHANCED_REORDER] Updating local rankings from final rankings');
      setLocalRankings(finalRankings);
    } else {
      console.log('🔥 [ENHANCED_REORDER] Skipping local ranking update - in progress operations:', {
        isDragging,
        isUpdating,
        manualAdjustmentInProgress
      });
    }
  }, [finalRankings, isDragging, isUpdating, manualAdjustmentInProgress]);

  const validateRankingsIntegrity = useCallback((rankings: RankedPokemon[]): boolean => {
    const uniqueIds = new Set(rankings.map(p => p.id));
    if (uniqueIds.size !== rankings.length) {
      console.error('🔥 [ENHANCED_REORDER_VALIDATION] Duplicate Pokemon IDs found in rankings!');
      return false;
    }
    
    const hasValidStructure = rankings.every(p => 
      typeof p.id === 'number' && 
      typeof p.name === 'string' && 
      typeof p.score === 'number'
    );
    
    if (!hasValidStructure) {
      console.error('🔥 [ENHANCED_REORDER_VALIDATION] Invalid Pokemon structure found!');
      return false;
    }
    
    return true;
  }, []);

  const applyManualScoreAdjustment = useCallback((
    draggedPokemon: RankedPokemon, 
    newIndex: number,
    rankings: RankedPokemon[]
  ) => {
    console.log('🔥 [MANUAL_SCORE_ADJUSTMENT] ===== APPLYING MANUAL SCORE ADJUSTMENT =====');
    console.log('🔥 [MANUAL_SCORE_ADJUSTMENT] preventAutoResorting:', preventAutoResorting);
    
    if (!preventAutoResorting) {
      console.log('🔥 [MANUAL_SCORE_ADJUSTMENT] ⚠️ Manual mode not active - skipping manual adjustment');
      return;
    }
    
    // Constants
    const MIN_SIGMA = 1.0;
    
    // Get current rating for the dragged Pokemon
    const currentRating = getRating(draggedPokemon.id.toString());
    console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Current rating - μ=${currentRating.mu.toFixed(5)}, σ=${currentRating.sigma.toFixed(5)}`);
    
    // Get Pokemon above and below the new position
    const abovePokemon = newIndex > 0 ? rankings[newIndex - 1] : null;
    const belowPokemon = newIndex < rankings.length - 1 ? rankings[newIndex + 1] : null;
    
    // Step A: Detailed Logging
    console.log(`[DRAG-END] Dragged Pokémon: ${draggedPokemon.name} (μ=${currentRating.mu.toFixed(5)}, σ=${currentRating.sigma.toFixed(5)}, displayedScore=${(currentRating.mu - currentRating.sigma).toFixed(5)})`);
    
    if (abovePokemon) {
      const aboveRating = getRating(abovePokemon.id.toString());
      console.log(`[DRAG-END] Above Pokémon: ${abovePokemon.name} (μ=${aboveRating.mu.toFixed(5)}, σ=${aboveRating.sigma.toFixed(5)}, displayedScore=${(aboveRating.mu - aboveRating.sigma).toFixed(5)})`);
    } else {
      console.log(`[DRAG-END] Above Pokémon: None (top position)`);
    }
    
    if (belowPokemon) {
      const belowRating = getRating(belowPokemon.id.toString());
      console.log(`[DRAG-END] Below Pokémon: ${belowPokemon.name} (μ=${belowRating.mu.toFixed(5)}, σ=${belowRating.sigma.toFixed(5)}, displayedScore=${(belowRating.mu - belowRating.sigma).toFixed(5)})`);
    } else {
      console.log(`[DRAG-END] Below Pokémon: None (bottom position)`);
    }
    
    // Signal that manual adjustment is in progress
    setManualAdjustmentInProgress(true);
    
    // Standard Drag Logic - Only when above and below have different scores
    if (abovePokemon && belowPokemon) {
      const aboveRating = getRating(abovePokemon.id.toString());
      const belowRating = getRating(belowPokemon.id.toString());
      const aboveScore = aboveRating.mu - aboveRating.sigma;
      const belowScore = belowRating.mu - belowRating.sigma;
      
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Above score: ${aboveScore.toFixed(5)}, Below score: ${belowScore.toFixed(5)}`);
      
      // Check if this is a standard drag scenario (different scores above and below)
      if (Math.abs(aboveScore - belowScore) > 0.00001) { // Use small epsilon for floating point comparison
        console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Standard drag scenario detected - applying manual score adjustment`);
        
        // Step 1: Calculate the exact midpoint displayed score
        const targetDisplayedScore = (aboveScore + belowScore) / 2;
        console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Target displayed score: ${targetDisplayedScore.toFixed(5)}`);
        
        // Step 2: Explicitly reduce sigma (σ) to indicate manual confidence
        const newSigma = Math.max(currentRating.sigma * 0.8, MIN_SIGMA);
        console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Reducing sigma from ${currentRating.sigma.toFixed(5)} to ${newSigma.toFixed(5)}`);
        
        // Step 3: Explicitly set mu (μ) based on the new sigma
        const newMu = targetDisplayedScore + newSigma;
        console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] New μ calculation: ${targetDisplayedScore.toFixed(5)} + ${newSigma.toFixed(5)} = ${newMu.toFixed(5)}`);
        
        const newRating = new Rating(newMu, newSigma);
        
        // Verify the final displayed score
        const finalDisplayedScore = newMu - newSigma;
        console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Final displayed score: ${finalDisplayedScore.toFixed(5)} (should equal target: ${targetDisplayedScore.toFixed(5)})`);
        
        // Update the rating in the store
        updateRating(draggedPokemon.id.toString(), newRating);
        
        console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ Manual score adjustment completed - Pokemon will stay in position ${newIndex + 1}`);
      } else {
        console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Tied scores detected - no adjustment for now (Step 1 only handles standard drag)`);
      }
    } else if (abovePokemon && !belowPokemon) {
      // Moved to bottom position
      const aboveRating = getRating(abovePokemon.id.toString());
      const aboveScore = aboveRating.mu - aboveRating.sigma;
      
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Moved to bottom - above score: ${aboveScore.toFixed(5)}`);
      
      // Step 1: Calculate target score (slightly below the Pokemon above)
      const targetDisplayedScore = aboveScore - 1.0;
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Target displayed score: ${targetDisplayedScore.toFixed(5)}`);
      
      // Step 2: Explicitly reduce sigma (σ) to indicate manual confidence
      const newSigma = Math.max(currentRating.sigma * 0.8, MIN_SIGMA);
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Reducing sigma from ${currentRating.sigma.toFixed(5)} to ${newSigma.toFixed(5)}`);
      
      // Step 3: Explicitly set mu (μ) based on the new sigma
      const newMu = targetDisplayedScore + newSigma;
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] New μ calculation: ${targetDisplayedScore.toFixed(5)} + ${newSigma.toFixed(5)} = ${newMu.toFixed(5)}`);
      
      const newRating = new Rating(newMu, newSigma);
      updateRating(draggedPokemon.id.toString(), newRating);
      
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ Bottom placement adjustment completed`);
      
    } else if (!abovePokemon && belowPokemon) {
      // Moved to top position
      const belowRating = getRating(belowPokemon.id.toString());
      const belowScore = belowRating.mu - belowRating.sigma;
      
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Moved to top - below score: ${belowScore.toFixed(5)}`);
      
      // Step 1: Calculate target score (slightly above the Pokemon below)
      const targetDisplayedScore = belowScore + 1.0;
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Target displayed score: ${targetDisplayedScore.toFixed(5)}`);
      
      // Step 2: Explicitly reduce sigma (σ) to indicate manual confidence
      const newSigma = Math.max(currentRating.sigma * 0.8, MIN_SIGMA);
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Reducing sigma from ${currentRating.sigma.toFixed(5)} to ${newSigma.toFixed(5)}`);
      
      // Step 3: Explicitly set mu (μ) based on the new sigma
      const newMu = targetDisplayedScore + newSigma;
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] New μ calculation: ${targetDisplayedScore.toFixed(5)} + ${newSigma.toFixed(5)} = ${newMu.toFixed(5)}`);
      
      const newRating = new Rating(newMu, newSigma);
      updateRating(draggedPokemon.id.toString(), newRating);
      
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ Top placement adjustment completed`);
      
    } else {
      console.log(`🔥 [MANUAL_SCORE_ADJUSTMENT] Single Pokemon in list - no adjustment needed`);
    }
    
    // Clear the manual adjustment flag after a short delay
    setTimeout(() => {
      setManualAdjustmentInProgress(false);
    }, 100);
  }, [getRating, updateRating, preventAutoResorting]);

  const recalculateScores = useCallback((rankings: RankedPokemon[]): RankedPokemon[] => {
    console.log('🔥 [ENHANCED_REORDER_RECALC] Recalculating scores for', rankings.length, 'Pokemon');
    console.log('🔥 [ENHANCED_REORDER_RECALC] Manual adjustment in progress:', manualAdjustmentInProgress);
    
    return rankings.map((pokemon) => {
      const rating = getRating(pokemon.id.toString());
      const conservativeEstimate = rating.mu - rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      
      return {
        ...pokemon,
        score: conservativeEstimate,
        confidence: confidence,
        rating: rating,
        count: pokemon.count || 0
      };
    });
  }, [getRating, manualAdjustmentInProgress]);

  const handleDragStart = useCallback((event: any) => {
    const draggedId = parseInt(event.active.id);
    setIsDragging(true);
    setDraggedPokemonId(draggedId);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Drag started for Pokemon ID:', draggedId);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Manual mode active:', preventAutoResorting);
  }, [preventAutoResorting]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setIsDragging(false);
    setDraggedPokemonId(null);
    
    if (!over || active.id === over.id) {
      console.log('🔥 [ENHANCED_REORDER_DRAG] Drag ended with no change');
      return;
    }

    console.log('🔥 [ENHANCED_REORDER_DRAG] ===== PROCESSING DRAG END =====');
    console.log('🔥 [ENHANCED_REORDER_DRAG] Active ID:', active.id, 'Over ID:', over.id);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Manual mode active:', preventAutoResorting);
    
    setIsUpdating(true);
    
    try {
      const oldIndex = localRankings.findIndex(p => p.id.toString() === active.id);
      const newIndex = localRankings.findIndex(p => p.id.toString() === over.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        console.error('🔥 [ENHANCED_REORDER_DRAG] Could not find Pokemon indices');
        setIsUpdating(false);
        return;
      }
      
      console.log('🔥 [ENHANCED_REORDER_DRAG] Moving from index', oldIndex, 'to', newIndex);
      
      const movedPokemon = localRankings[oldIndex];
      console.log('🔥 [ENHANCED_REORDER_DRAG] Moving Pokemon:', movedPokemon.name);
      
      // Create new array with moved Pokemon
      const newRankings = arrayMove(localRankings, oldIndex, newIndex);
      
      // Validate the integrity of the new rankings
      if (!validateRankingsIntegrity(newRankings)) {
        console.error('🔥 [ENHANCED_REORDER_DRAG] Rankings integrity check failed');
        setIsUpdating(false);
        return;
      }
      
      if (preventAutoResorting) {
        console.log('🔥 [ENHANCED_REORDER_DRAG] 🎯 MANUAL MODE: Applying manual score adjustment');
        // Apply manual score adjustment instead of TrueSkill battles
        applyManualScoreAdjustment(movedPokemon, newIndex, newRankings);
      } else {
        console.log('🔥 [ENHANCED_REORDER_DRAG] 🤖 BATTLE MODE: Would apply TrueSkill battles (not implemented in this function)');
      }
      
      // Recalculate scores with updated ratings
      const updatedRankings = recalculateScores(newRankings);
      
      console.log('🔥 [ENHANCED_REORDER_DRAG] Updated rankings calculated');
      
      // Update local state
      setLocalRankings(updatedRankings);
      
      // Notify parent component
      onRankingsUpdate(updatedRankings);
      
      console.log('🔥 [ENHANCED_REORDER_DRAG] ✅ Drag end processing complete');
      
    } catch (error) {
      console.error('🔥 [ENHANCED_REORDER_DRAG] Error during drag end processing:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [localRankings, validateRankingsIntegrity, applyManualScoreAdjustment, recalculateScores, onRankingsUpdate, preventAutoResorting]);

  // Enhanced manual reorder function that handles both new additions and reordering
  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log('🔥 [ENHANCED_MANUAL_REORDER] ===== MANUAL REORDER CALLED =====');
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Pokemon ID:', draggedPokemonId);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Source Index:', sourceIndex);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Destination Index:', destinationIndex);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Manual mode active:', preventAutoResorting);
    
    setIsUpdating(true);
    
    try {
      let newRankings: RankedPokemon[];
      
      if (sourceIndex === -1) {
        // CASE A: New Pokemon addition (sourceIndex = -1)
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ ADDING NEW POKEMON TO RANKINGS');
        
        // Get Pokemon data from lookup map
        const pokemonData = pokemonLookupMap.get(draggedPokemonId);
        if (!pokemonData) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Pokemon not found in lookup map:', draggedPokemonId);
          setIsUpdating(false);
          return;
        }
        
        // Get current rating from TrueSkill store
        const rating = getRating(draggedPokemonId.toString());
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
        
        // Create ranked Pokemon object
        const newRankedPokemon: RankedPokemon = {
          ...pokemonData,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          count: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] New Pokemon object:', newRankedPokemon.name, 'Score:', newRankedPokemon.score);
        
        // Insert at the specified position
        newRankings = [...localRankings];
        newRankings.splice(destinationIndex, 0, newRankedPokemon);
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Inserted at index', destinationIndex, 'New length:', newRankings.length);
        
        if (preventAutoResorting) {
          // Apply manual score adjustment for new Pokemon
          applyManualScoreAdjustment(newRankedPokemon, destinationIndex, newRankings);
        }
        
      } else {
        // CASE B: Existing Pokemon reordering
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ REORDERING EXISTING POKEMON');
        
        if (sourceIndex < 0 || sourceIndex >= localRankings.length) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Invalid source index:', sourceIndex);
          setIsUpdating(false);
          return;
        }
        
        if (destinationIndex < 0 || destinationIndex >= localRankings.length) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Invalid destination index:', destinationIndex);
          setIsUpdating(false);
          return;
        }
        
        // Use arrayMove for existing Pokemon reordering
        newRankings = arrayMove(localRankings, sourceIndex, destinationIndex);
        const movedPokemon = newRankings[destinationIndex];
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Moved from', sourceIndex, 'to', destinationIndex);
        
        if (preventAutoResorting) {
          // Apply manual score adjustment for reordered Pokemon
          applyManualScoreAdjustment(movedPokemon, destinationIndex, newRankings);
        }
      }
      
      // Validate the integrity of the new rankings
      if (!validateRankingsIntegrity(newRankings)) {
        console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Rankings integrity check failed');
        setIsUpdating(false);
        return;
      }
      
      // Recalculate scores for all Pokemon
      const updatedRankings = recalculateScores(newRankings);
      
      // Update local state
      setLocalRankings(updatedRankings);
      
      // Notify parent component
      onRankingsUpdate(updatedRankings);
      
      console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder completed successfully');
      
    } catch (error) {
      console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Error during manual reorder:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [localRankings, pokemonLookupMap, getRating, validateRankingsIntegrity, applyManualScoreAdjustment, recalculateScores, onRankingsUpdate, preventAutoResorting]);

  const displayRankings = useMemo(() => {
    return localRankings.map((pokemon) => ({
      ...pokemon,
      isBeingDragged: draggedPokemonId === pokemon.id
    }));
  }, [localRankings, draggedPokemonId]);

  return {
    displayRankings,
    handleDragStart,
    handleDragEnd,
    handleEnhancedManualReorder,
    isDragging,
    isUpdating
  };
};
