import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from '@/services/pokemon';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

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
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] addImpliedBattle provided:', !!addImpliedBattle);

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
    const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ===== APPLYING MANUAL SCORE ADJUSTMENT =====');
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Operation ID: ${operationId}`);
    console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] draggedPokemon:', draggedPokemon.name, 'ID:', draggedPokemon.id);
    console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target position (newIndex):', newIndex);
    
    // Constants
    const MIN_SIGMA = 1.0;
    const EPSILON = 0.001; // For practical identical detection
    const GROUP_ADJUSTMENT = 0.0001; // Small adjustment for group separation
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Using MIN_SIGMA: ${MIN_SIGMA}, EPSILON: ${EPSILON}`);
    
    // Get current rating for the dragged Pokemon
    const currentRating = getRating(draggedPokemon.id.toString());
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Current rating from store - μ=${currentRating.mu.toFixed(5)}, σ=${currentRating.sigma.toFixed(5)}`);
    
    // Create the final rankings array to determine proper neighbors
    const finalRankingsAfterMove = [...rankings];
    
    const existingIndex = rankings.findIndex(p => p.id === draggedPokemon.id);
    if (existingIndex === -1) {
      // New Pokemon - insert at the target position
      finalRankingsAfterMove.splice(newIndex, 0, draggedPokemon);
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] NEW POKEMON: Inserted at position ${newIndex}`);
    } else {
      // Existing Pokemon - remove from old position, insert at new position
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] EXISTING POKEMON: Moving from ${existingIndex} to ${newIndex}`);
      finalRankingsAfterMove.splice(existingIndex, 1);
      finalRankingsAfterMove.splice(newIndex, 0, draggedPokemon);
    }
    
    // Get the actual neighbors in the final arrangement
    const abovePokemon = newIndex > 0 ? finalRankingsAfterMove[newIndex - 1] : null;
    const belowPokemon = newIndex < finalRankingsAfterMove.length - 1 ? finalRankingsAfterMove[newIndex + 1] : null;
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] NEIGHBORS:`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Above:`, abovePokemon ? `${abovePokemon.name} (ID: ${abovePokemon.id})` : 'None');
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target: ${draggedPokemon.name} (ID: ${draggedPokemon.id})`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Below:`, belowPokemon ? `${belowPokemon.name} (ID: ${belowPokemon.id})` : 'None');
    
    // Get neighbor scores from TrueSkill store
    let aboveDisplayedScore = 0, belowDisplayedScore = 0;
    let aboveRating: Rating | null = null, belowRating: Rating | null = null;
    
    if (abovePokemon) {
      aboveRating = getRating(abovePokemon.id.toString());
      aboveDisplayedScore = aboveRating.mu - aboveRating.sigma;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Above ${abovePokemon.name}: displayedScore=${aboveDisplayedScore.toFixed(5)}`);
    }
    
    if (belowPokemon) {
      belowRating = getRating(belowPokemon.id.toString());
      belowDisplayedScore = belowRating.mu - belowRating.sigma;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Below ${belowPokemon.name}: displayedScore=${belowDisplayedScore.toFixed(5)}`);
    }

    // 🟢 SIMPLIFIED LOGIC: Check if immediate neighbors have identical scores
    if (abovePokemon && belowPokemon && Math.abs(aboveDisplayedScore - belowDisplayedScore) < EPSILON) {
      console.log(`🔵🔵🔵 [IDENTICAL_NEIGHBORS] ===== IDENTICAL NEIGHBOR SCORES =====`);
      console.log(`🔵🔵🔵 [IDENTICAL_NEIGHBORS] Identical score value: ${aboveDisplayedScore.toFixed(5)}`);
      
      const identicalScore = aboveDisplayedScore;
      
      // Find all Pokemon with the same score as the upper neighbor
      const upperGroupPokemon = finalRankingsAfterMove.filter((pokemon, index) => {
        if (index === newIndex) return false; // Skip the dragged Pokemon
        const rating = getRating(pokemon.id.toString());
        const score = rating.mu - rating.sigma;
        return Math.abs(score - identicalScore) < EPSILON;
      });
      
      console.log(`🔵🔵🔵 [IDENTICAL_NEIGHBORS] Found ${upperGroupPokemon.length} Pokemon with identical scores`);
      
      // Separate into upper and lower groups based on position relative to drop point
      const upperGroup: RankedPokemon[] = [];
      const lowerGroup: RankedPokemon[] = [];
      
      for (const pokemon of upperGroupPokemon) {
        const pokemonIndex = finalRankingsAfterMove.findIndex(p => p.id === pokemon.id);
        if (pokemonIndex < newIndex) {
          upperGroup.push(pokemon);
        } else if (pokemonIndex > newIndex) {
          lowerGroup.push(pokemon);
        }
      }
      
      console.log(`🔵🔵🔵 [IDENTICAL_NEIGHBORS] Upper group: ${upperGroup.length} Pokemon`);
      console.log(`🔵🔵🔵 [IDENTICAL_NEIGHBORS] Lower group: ${lowerGroup.length} Pokemon`);
      
      // Adjust upper group (increase by GROUP_ADJUSTMENT)
      for (const pokemon of upperGroup) {
        const rating = getRating(pokemon.id.toString());
        const newDisplayedScore = identicalScore + GROUP_ADJUSTMENT;
        const newSigma = Math.max(rating.sigma * 0.95, MIN_SIGMA);
        const newMu = newDisplayedScore + newSigma;
        
        console.log(`🔵🔵🔵 [IDENTICAL_NEIGHBORS] Adjusting upper ${pokemon.name}: ${identicalScore.toFixed(5)} → ${newDisplayedScore.toFixed(5)}`);
        
        const newRating = new Rating(newMu, newSigma);
        updateRating(pokemon.id.toString(), newRating);
      }
      
      // Adjust lower group (decrease by GROUP_ADJUSTMENT)
      for (const pokemon of lowerGroup) {
        const rating = getRating(pokemon.id.toString());
        const newDisplayedScore = identicalScore - GROUP_ADJUSTMENT;
        const newSigma = Math.max(rating.sigma * 0.95, MIN_SIGMA);
        const newMu = newDisplayedScore + newSigma;
        
        console.log(`🔵🔵🔵 [IDENTICAL_NEIGHBORS] Adjusting lower ${pokemon.name}: ${identicalScore.toFixed(5)} → ${newDisplayedScore.toFixed(5)}`);
        
        const newRating = new Rating(newMu, newSigma);
        updateRating(pokemon.id.toString(), newRating);
      }
      
      // Set dragged Pokemon to the original identical score
      const newSigma = Math.max(currentRating.sigma * 0.8, MIN_SIGMA);
      const newMu = identicalScore + newSigma;
      
      console.log(`🔵🔵🔵 [IDENTICAL_NEIGHBORS] Setting dragged ${draggedPokemon.name} to: ${identicalScore.toFixed(5)}`);
      
      const newRating = new Rating(newMu, newSigma);
      updateRating(draggedPokemon.id.toString(), newRating);
      
      console.log(`🔵🔵🔵 [IDENTICAL_NEIGHBORS] ===== IDENTICAL NEIGHBOR ADJUSTMENT COMPLETE =====`);
      return;
    }

    // Standard logic for non-identical scores or simple cases
    let targetDisplayedScore: number;
    
    if (abovePokemon && belowPokemon) {
      // Between two Pokemon - use simple average
      targetDisplayedScore = (aboveDisplayedScore + belowDisplayedScore) / 2;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] BETWEEN TWO: target = (${aboveDisplayedScore.toFixed(5)} + ${belowDisplayedScore.toFixed(5)}) / 2 = ${targetDisplayedScore.toFixed(5)}`);
    } else if (abovePokemon && !belowPokemon) {
      // Bottom position - slightly below the Pokemon above
      targetDisplayedScore = aboveDisplayedScore - 0.1;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] BOTTOM: target = ${aboveDisplayedScore.toFixed(5)} - 0.1 = ${targetDisplayedScore.toFixed(5)}`);
    } else if (!abovePokemon && belowPokemon) {
      // Top position - slightly above the Pokemon below
      targetDisplayedScore = belowDisplayedScore + 0.1;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] TOP: target = ${belowDisplayedScore.toFixed(5)} + 0.1 = ${targetDisplayedScore.toFixed(5)}`);
    } else {
      // Single Pokemon in list - no adjustment needed
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] SINGLE POKEMON - no adjustment needed`);
      return;
    }
    
    // Calculate new mu and sigma
    const newSigma = Math.max(currentRating.sigma * 0.7, MIN_SIGMA);
    const newMu = targetDisplayedScore + newSigma;
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] FINAL CALCULATION:`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target score: ${targetDisplayedScore.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] New σ: ${newSigma.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] New μ: ${newMu.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Verification: μ - σ = ${(newMu - newSigma).toFixed(5)} (should equal ${targetDisplayedScore.toFixed(5)})`);
    
    // Update the rating
    const newRating = new Rating(newMu, newSigma);
    updateRating(draggedPokemon.id.toString(), newRating);
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ===== COMPLETE (${operationId}) =====`);
  }, [getRating, updateRating, preventAutoResorting, addImpliedBattle]);

  const recalculateScores = useCallback((rankings: RankedPokemon[]): RankedPokemon[] => {
    console.log('🔥 [ENHANCED_REORDER_RECALC] ===== RECALCULATING SCORES =====');
    console.log('🔥 [ENHANCED_REORDER_RECALC] Recalculating scores for', rankings.length, 'Pokemon');
    
    const recalculated = rankings.map((pokemon, index) => {
      const rating = getRating(pokemon.id.toString());
      const conservativeEstimate = rating.mu - rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      
      // FIXED: Apply proper name formatting to ensure proper display
      const formattedName = formatPokemonName(pokemon.name);
      
      if (pokemon.id === 613) {
        console.log(`🧊🧊🧊 [CUBCHOO_RECALC] Position: ${index}, Score: ${conservativeEstimate.toFixed(5)}`);
        console.log(`🧊🧊🧊 [CUBCHOO_RECALC] Name formatting: "${pokemon.name}" -> "${formattedName}"`);
      }
      
      return {
        ...pokemon,
        name: formattedName, // Use properly formatted name
        score: conservativeEstimate,
        confidence: confidence,
        rating: rating,
        count: pokemon.count || 0
      };
    });
    
    // 🔴 STEP 5: Resort rankings by displayed score after all adjustments
    const sortedRecalculated = recalculated.sort((a, b) => b.score - a.score);
    
    console.log('🔴🔴🔴 [ENHANCED_REORDER_RECALC] Rankings resorted by displayed score');
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
      
      const updatedRankings = recalculateScores(newRankings);
      
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] Updated rankings calculated');
      
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
        
        // FIXED: Apply proper name formatting when creating new RankedPokemon
        const formattedName = formatPokemonName(pokemonData.name);
        
        const newRankedPokemon: RankedPokemon = {
          ...pokemonData,
          name: formattedName, // Use properly formatted name
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          count: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] New Pokemon object:', newRankedPokemon.name, 'Score:', newRankedPokemon.score);
        console.log('🔥 [ENHANCED_MANUAL_REORDER] Name formatting applied:', pokemonData.name, '->', formattedName);
        
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
