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
    const operationId = `MANUAL_REORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔥🔥🔥 [${operationId}] ===== APPLYING MANUAL SCORE ADJUSTMENT =====`);
    console.log(`🔥🔥🔥 [${operationId}] draggedPokemon: ${draggedPokemon.name} (ID: ${draggedPokemon.id})`);
    console.log(`🔥🔥🔥 [${operationId}] Target position (newIndex): ${newIndex}`);
    
    // Constants
    const MIN_SIGMA = 1.0;
    
    // Get current rating for the dragged Pokemon
    const currentRating = getRating(draggedPokemon.id.toString());
    console.log(`🔥🔥🔥 [${operationId}] Current rating from store - μ=${currentRating.mu.toFixed(5)}, σ=${currentRating.sigma.toFixed(5)}, score=${(currentRating.mu - currentRating.sigma).toFixed(5)}`);
    
    // Create the final rankings array to determine proper neighbors
    const finalRankingsAfterMove = [...rankings];
    
    const existingIndex = rankings.findIndex(p => p.id === draggedPokemon.id);
    if (existingIndex === -1) {
      // New Pokemon - insert at the target position
      finalRankingsAfterMove.splice(newIndex, 0, draggedPokemon);
      console.log(`🔥🔥🔥 [${operationId}] NEW POKEMON: Inserted at position ${newIndex}`);
    } else {
      // Existing Pokemon - remove from old position, insert at new position
      console.log(`🔥🔥🔥 [${operationId}] EXISTING POKEMON: Moving from ${existingIndex} to ${newIndex}`);
      finalRankingsAfterMove.splice(existingIndex, 1);
      finalRankingsAfterMove.splice(newIndex, 0, draggedPokemon);
    }
    
    // Get the actual neighbors in the final arrangement
    const abovePokemon = newIndex > 0 ? finalRankingsAfterMove[newIndex - 1] : null;
    const belowPokemon = newIndex < finalRankingsAfterMove.length - 1 ? finalRankingsAfterMove[newIndex + 1] : null;
    
    console.log(`🔥🔥🔥 [${operationId}] NEIGHBORS IN FINAL ARRANGEMENT:`);
    console.log(`🔥🔥🔥 [${operationId}] Above: ${abovePokemon ? `${abovePokemon.name} (ID: ${abovePokemon.id})` : 'None'}`);
    console.log(`🔥🔥🔥 [${operationId}] Target: ${draggedPokemon.name} (ID: ${draggedPokemon.id})`);
    console.log(`🔥🔥🔥 [${operationId}] Below: ${belowPokemon ? `${belowPokemon.name} (ID: ${belowPokemon.id})` : 'None'}`);
    
    // Get neighbor scores from TrueSkill store
    let aboveScore = 0, belowScore = 0;
    
    if (abovePokemon) {
      const aboveRating = getRating(abovePokemon.id.toString());
      aboveScore = aboveRating.mu - aboveRating.sigma;
      console.log(`🔥🔥🔥 [${operationId}] Above ${abovePokemon.name}: score=${aboveScore.toFixed(5)}`);
    }
    
    if (belowPokemon) {
      const belowRating = getRating(belowPokemon.id.toString());
      belowScore = belowRating.mu - belowRating.sigma;
      console.log(`🔥🔥🔥 [${operationId}] Below ${belowPokemon.name}: score=${belowScore.toFixed(5)}`);
    }
    
    // Calculate target score
    let targetDisplayedScore: number;
    
    if (abovePokemon && belowPokemon) {
      // Between two Pokemon - use simple average
      targetDisplayedScore = (aboveScore + belowScore) / 2;
      console.log(`🔥🔥🔥 [${operationId}] BETWEEN CALCULATION: (${aboveScore.toFixed(5)} + ${belowScore.toFixed(5)}) / 2 = ${targetDisplayedScore.toFixed(5)}`);
    } else if (abovePokemon && !belowPokemon) {
      // Bottom position - slightly below the Pokemon above
      targetDisplayedScore = aboveScore - 0.1;
      console.log(`🔥🔥🔥 [${operationId}] BOTTOM CALCULATION: ${aboveScore.toFixed(5)} - 0.1 = ${targetDisplayedScore.toFixed(5)}`);
    } else if (!abovePokemon && belowPokemon) {
      // Top position - slightly above the Pokemon below
      targetDisplayedScore = belowScore + 0.1;
      console.log(`🔥🔥🔥 [${operationId}] TOP CALCULATION: ${belowScore.toFixed(5)} + 0.1 = ${targetDisplayedScore.toFixed(5)}`);
    } else {
      // Single Pokemon in list - no adjustment needed
      console.log(`🔥🔥🔥 [${operationId}] SINGLE POKEMON - no adjustment needed`);
      return;
    }
    
    // Calculate new mu and sigma
    const newSigma = Math.max(currentRating.sigma * 0.7, MIN_SIGMA);
    const newMu = targetDisplayedScore + newSigma;
    
    console.log(`🔥🔥🔥 [${operationId}] FINAL CALCULATION:`);
    console.log(`🔥🔥🔥 [${operationId}] Target score: ${targetDisplayedScore.toFixed(5)}`);
    console.log(`🔥🔥🔥 [${operationId}] New μ: ${newMu.toFixed(5)}, New σ: ${newSigma.toFixed(5)}`);
    
    // Update the rating
    const newRating = new Rating(newMu, newSigma);
    updateRating(draggedPokemon.id.toString(), newRating);
    
    console.log(`🔥🔥🔥 [${operationId}] ===== MANUAL SCORE ADJUSTMENT COMPLETE =====`);
  }, [getRating, updateRating]);

  const recalculateScores = useCallback((rankings: RankedPokemon[]): RankedPokemon[] => {
    console.log('🔥 [ENHANCED_REORDER_RECALC] ===== RECALCULATING SCORES =====');
    console.log('🔥 [ENHANCED_REORDER_RECALC] Recalculating scores for', rankings.length, 'Pokemon');
    
    const recalculated = rankings.map((pokemon) => {
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
    
    // ALWAYS sort by score after recalculation
    const sortedRecalculated = recalculated.sort((a, b) => b.score - a.score);
    console.log('🔥 [ENHANCED_REORDER_RECALC] Sorted by score - top 3:', 
      sortedRecalculated.slice(0, 3).map((p, i) => `${i+1}. ${p.name}: ${p.score.toFixed(3)}`));
    
    console.log('🔥 [ENHANCED_REORDER_RECALC] ===== RECALCULATION COMPLETE =====');
    return sortedRecalculated;
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
      
      const newRankings = arrayMove(localRankings, oldIndex, newIndex);
      
      if (!validateRankingsIntegrity(newRankings)) {
        console.error('🔥 [ENHANCED_REORDER_DRAG] Rankings integrity check failed');
        return;
      }
      
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] APPLYING MANUAL SCORE ADJUSTMENT');
      
      applyManualScoreAdjustment(movedPokemon, newIndex, newRankings);
      
      // CRITICAL: Recalculate ALL scores and re-sort after adjustment
      const updatedRankings = recalculateScores(newRankings);
      
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] Updated rankings calculated and sorted');
      
      setLocalRankings(updatedRankings);
      onRankingsUpdate(updatedRankings);
      
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] ✅ Drag end processing complete');
      
    } catch (error) {
      console.error('🔥 [ENHANCED_REORDER_DRAG] Error during drag end processing:', error);
    } finally {
      setTimeout(() => {
        setDragState(prev => ({ ...prev, isUpdating: false, manualAdjustmentInProgress: false }));
      }, 100);
    }
  }, [localRankings, validateRankingsIntegrity, applyManualScoreAdjustment, recalculateScores, onRankingsUpdate]);

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
        console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ✅ ADDING NEW POKEMON TO RANKINGS');
        
        const pokemonData = pokemonLookupMap.get(draggedPokemonId);
        if (!pokemonData) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Pokemon not found in lookup map:', draggedPokemonId);
          return;
        }
        
        const rating = getRating(draggedPokemonId.toString());
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
        
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
        
        newRankings = [...localRankings];
        newRankings.splice(destinationIndex, 0, newRankedPokemon);
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Inserted at index', destinationIndex, 'New length:', newRankings.length);
        
        applyManualScoreAdjustment(newRankedPokemon, destinationIndex, localRankings);
        
      } else {
        console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ✅ REORDERING EXISTING POKEMON');
        
        if (sourceIndex < 0 || sourceIndex >= localRankings.length) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Invalid source index:', sourceIndex);
          return;
        }
        
        if (destinationIndex < 0 || destinationIndex >= localRankings.length) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Invalid destination index:', destinationIndex);
          return;
        }
        
        newRankings = arrayMove(localRankings, sourceIndex, destinationIndex);
        const movedPokemon = newRankings[destinationIndex];
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Moved from', sourceIndex, 'to', destinationIndex);
        
        applyManualScoreAdjustment(movedPokemon, destinationIndex, localRankings);
      }
      
      if (!validateRankingsIntegrity(newRankings)) {
        console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Rankings integrity check failed');
        return;
      }
      
      // CRITICAL: Recalculate ALL scores and re-sort after any manual reorder
      const updatedRankings = recalculateScores(newRankings);
      
      setLocalRankings(updatedRankings);
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
