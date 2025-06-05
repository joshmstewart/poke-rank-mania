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

  // Simplified state management
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedPokemonId: null as number | null,
    isUpdating: false,
    manualAdjustmentInProgress: false
  });

  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  // Initialize local rankings once
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current && finalRankings.length > 0) {
      console.log('🔥 [ENHANCED_REORDER] Initializing local rankings');
      setLocalRankings(finalRankings);
      isInitialized.current = true;
    }
  }, [finalRankings]);

  // Update local rankings when final rankings change (but not during operations)
  useEffect(() => {
    if (isInitialized.current && 
        !dragState.isDragging && 
        !dragState.isUpdating && 
        !dragState.manualAdjustmentInProgress &&
        finalRankings.length > 0) {
      console.log('🔥 [ENHANCED_REORDER] Updating local rankings from final rankings');
      setLocalRankings(finalRankings);
    }
  }, [finalRankings, dragState.isDragging, dragState.isUpdating, dragState.manualAdjustmentInProgress]);

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
    console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ===== APPLYING MANUAL SCORE ADJUSTMENT =====');
    console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] draggedPokemon:', draggedPokemon.name);
    console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target position (newIndex):', newIndex);
    console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] rankings.length:', rankings.length);
    
    // Constants
    const MIN_SIGMA = 1.0;
    
    // Get current rating for the dragged Pokemon
    const currentRating = getRating(draggedPokemon.id.toString());
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Current rating - μ=${currentRating.mu.toFixed(5)}, σ=${currentRating.sigma.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Current displayed score: ${(currentRating.mu - currentRating.sigma).toFixed(5)}`);
    
    // CRITICAL FIX: Create the final rankings array to determine correct neighbors
    // This simulates what the array will look like AFTER the Pokemon is placed
    const finalRankingsAfterMove = [...rankings];
    
    // For new additions (when Pokemon wasn't in rankings before)
    const existingIndex = rankings.findIndex(p => p.id === draggedPokemon.id);
    if (existingIndex === -1) {
      // New Pokemon - insert at the target position
      finalRankingsAfterMove.splice(newIndex, 0, draggedPokemon);
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] NEW POKEMON: Inserted at position ${newIndex}`);
    } else {
      // Existing Pokemon - remove from old position and insert at new position
      finalRankingsAfterMove.splice(existingIndex, 1);
      finalRankingsAfterMove.splice(newIndex, 0, draggedPokemon);
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] EXISTING POKEMON: Moved from ${existingIndex} to ${newIndex}`);
    }
    
    // Now get the Pokemon that will be above and below in the final arrangement
    const abovePokemon = newIndex > 0 ? finalRankingsAfterMove[newIndex - 1] : null;
    const belowPokemon = newIndex < finalRankingsAfterMove.length - 1 ? finalRankingsAfterMove[newIndex + 1] : null;
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] FINAL ARRANGEMENT:`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Above Pokemon:`, abovePokemon ? `${abovePokemon.name} at final position ${newIndex - 1}` : 'None (top position)');
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target Pokemon: ${draggedPokemon.name} at final position ${newIndex}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Below Pokemon:`, belowPokemon ? `${belowPokemon.name} at final position ${newIndex + 1}` : 'None (bottom position)');
    
    if (abovePokemon) {
      const aboveRating = getRating(abovePokemon.id.toString());
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Above ${abovePokemon.name}: μ=${aboveRating.mu.toFixed(5)}, σ=${aboveRating.sigma.toFixed(5)}, score=${(aboveRating.mu - aboveRating.sigma).toFixed(5)}`);
    }
    
    if (belowPokemon) {
      const belowRating = getRating(belowPokemon.id.toString());
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Below ${belowPokemon.name}: μ=${belowRating.mu.toFixed(5)}, σ=${belowRating.sigma.toFixed(5)}, score=${(belowRating.mu - belowRating.sigma).toFixed(5)}`);
    }
    
    // Calculate target score based on final position
    let targetDisplayedScore: number;
    
    if (abovePokemon && belowPokemon) {
      // Between two Pokemon - midpoint
      const aboveRating = getRating(abovePokemon.id.toString());
      const belowRating = getRating(belowPokemon.id.toString());
      const aboveScore = aboveRating.mu - aboveRating.sigma;
      const belowScore = belowRating.mu - belowRating.sigma;
      targetDisplayedScore = (aboveScore + belowScore) / 2;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] BETWEEN TWO: above=${aboveScore.toFixed(5)}, below=${belowScore.toFixed(5)}, target=${targetDisplayedScore.toFixed(5)}`);
    } else if (abovePokemon && !belowPokemon) {
      // Bottom position - slightly below the Pokemon above
      const aboveRating = getRating(abovePokemon.id.toString());
      const aboveScore = aboveRating.mu - aboveRating.sigma;
      targetDisplayedScore = aboveScore - 1.0;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] BOTTOM POSITION: above=${aboveScore.toFixed(5)}, target=${targetDisplayedScore.toFixed(5)}`);
    } else if (!abovePokemon && belowPokemon) {
      // Top position - slightly above the Pokemon below
      const belowRating = getRating(belowPokemon.id.toString());
      const belowScore = belowRating.mu - belowRating.sigma;
      targetDisplayedScore = belowScore + 1.0;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] TOP POSITION: below=${belowScore.toFixed(5)}, target=${targetDisplayedScore.toFixed(5)}`);
    } else {
      // Single Pokemon in list
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] SINGLE POKEMON - no adjustment needed`);
      return;
    }
    
    // Calculate new mu and sigma
    const newSigma = Math.max(currentRating.sigma * 0.8, MIN_SIGMA);
    const newMu = targetDisplayedScore + newSigma;
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] CALCULATED VALUES:`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target displayed score: ${targetDisplayedScore.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] New μ: ${newMu.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] New σ: ${newSigma.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] VERIFICATION: new displayed score = ${(newMu - newSigma).toFixed(5)} (should equal target: ${targetDisplayedScore.toFixed(5)})`);
    
    // Update the rating in the store
    const newRating = new Rating(newMu, newSigma);
    updateRating(draggedPokemon.id.toString(), newRating);
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ Rating updated in TrueSkill store`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ Pokemon ${draggedPokemon.name} should now appear at position ${newIndex} after auto-sort`);
  }, [getRating, updateRating]);

  const recalculateScores = useCallback((rankings: RankedPokemon[]): RankedPokemon[] => {
    console.log('🔥 [ENHANCED_REORDER_RECALC] Recalculating scores for', rankings.length, 'Pokemon');
    
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
  }, [getRating]);

  const handleDragStart = useCallback((event: any) => {
    const draggedId = parseInt(event.active.id);
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedPokemonId: draggedId
    }));
    console.log('🔥 [ENHANCED_REORDER_DRAG] Drag started for Pokemon ID:', draggedId);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset drag state first
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedPokemonId: null
    }));
    
    if (!over || active.id === over.id) {
      console.log('🔥 [ENHANCED_REORDER_DRAG] Drag ended with no change');
      return;
    }

    console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] ===== PROCESSING DRAG END =====');
    console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] Active ID:', active.id, 'Over ID:', over.id);
    
    // Set updating flag
    setDragState(prev => ({ ...prev, isUpdating: true, manualAdjustmentInProgress: true }));
    
    try {
      const oldIndex = localRankings.findIndex(p => p.id.toString() === active.id);
      const newIndex = localRankings.findIndex(p => p.id.toString() === over.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        console.error('🔥 [ENHANCED_REORDER_DRAG] Could not find Pokemon indices');
        return;
      }
      
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] Moving from index', oldIndex, 'to', newIndex);
      
      const movedPokemon = localRankings[oldIndex];
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] Moving Pokemon:', movedPokemon.name);
      
      // Create new array with moved Pokemon
      const newRankings = arrayMove(localRankings, oldIndex, newIndex);
      
      // Validate the integrity of the new rankings
      if (!validateRankingsIntegrity(newRankings)) {
        console.error('🔥 [ENHANCED_REORDER_DRAG] Rankings integrity check failed');
        return;
      }
      
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] APPLYING MANUAL SCORE ADJUSTMENT');
      
      // Apply manual score adjustment
      applyManualScoreAdjustment(movedPokemon, newIndex, newRankings);
      
      // Recalculate scores with updated ratings
      const updatedRankings = recalculateScores(newRankings);
      
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] Updated rankings calculated');
      
      // Update local state
      setLocalRankings(updatedRankings);
      
      // Notify parent component
      onRankingsUpdate(updatedRankings);
      
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] ✅ Drag end processing complete');
      
    } catch (error) {
      console.error('🔥 [ENHANCED_REORDER_DRAG] Error during drag end processing:', error);
    } finally {
      // Clear flags after a delay to prevent interference
      setTimeout(() => {
        setDragState(prev => ({ ...prev, isUpdating: false, manualAdjustmentInProgress: false }));
      }, 100);
    }
  }, [localRankings, validateRankingsIntegrity, applyManualScoreAdjustment, recalculateScores, onRankingsUpdate]);

  // Enhanced manual reorder function that handles both new additions and reordering
  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ===== MANUAL REORDER CALLED =====');
    console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] Pokemon ID:', draggedPokemonId);
    console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] Source Index:', sourceIndex);
    console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] Destination Index:', destinationIndex);
    
    setDragState(prev => ({ ...prev, isUpdating: true, manualAdjustmentInProgress: true }));
    
    try {
      let newRankings: RankedPokemon[];
      
      if (sourceIndex === -1) {
        // CASE A: New Pokemon addition (sourceIndex = -1)
        console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ✅ ADDING NEW POKEMON TO RANKINGS');
        
        // Get Pokemon data from lookup map
        const pokemonData = pokemonLookupMap.get(draggedPokemonId);
        if (!pokemonData) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Pokemon not found in lookup map:', draggedPokemonId);
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
        
        // Apply manual score adjustment for new Pokemon
        applyManualScoreAdjustment(newRankedPokemon, destinationIndex, localRankings);
        
      } else {
        // CASE B: Existing Pokemon reordering
        console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ✅ REORDERING EXISTING POKEMON');
        
        if (sourceIndex < 0 || sourceIndex >= localRankings.length) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Invalid source index:', sourceIndex);
          return;
        }
        
        if (destinationIndex < 0 || destinationIndex >= localRankings.length) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Invalid destination index:', destinationIndex);
          return;
        }
        
        // Use arrayMove for existing Pokemon reordering
        newRankings = arrayMove(localRankings, sourceIndex, destinationIndex);
        const movedPokemon = newRankings[destinationIndex];
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Moved from', sourceIndex, 'to', destinationIndex);
        
        // Apply manual score adjustment for reordered Pokemon (pass original rankings for correct neighbor calculation)
        applyManualScoreAdjustment(movedPokemon, destinationIndex, localRankings);
      }
      
      // Validate the integrity of the new rankings
      if (!validateRankingsIntegrity(newRankings)) {
        console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Rankings integrity check failed');
        return;
      }
      
      // Recalculate scores for all Pokemon
      const updatedRankings = recalculateScores(newRankings);
      
      // Update local state
      setLocalRankings(updatedRankings);
      
      // Notify parent component
      onRankingsUpdate(updatedRankings);
      
      console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder completed successfully');
      
    } catch (error) {
      console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Error during manual reorder:', error);
    } finally {
      setTimeout(() => {
        setDragState(prev => ({ ...prev, isUpdating: false, manualAdjustmentInProgress: false }));
      }, 100);
    }
  }, [localRankings, pokemonLookupMap, getRating, validateRankingsIntegrity, applyManualScoreAdjustment, recalculateScores, onRankingsUpdate]);

  const displayRankings = useMemo(() => {
    return localRankings.map((pokemon) => ({
      ...pokemon,
      isBeingDragged: dragState.draggedPokemonId === pokemon.id
    }));
  }, [localRankings, dragState.draggedPokemonId]);

  return {
    displayRankings,
    handleDragStart,
    handleDragEnd,
    handleEnhancedManualReorder,
    isDragging: dragState.isDragging,
    isUpdating: dragState.isUpdating
  };
};
