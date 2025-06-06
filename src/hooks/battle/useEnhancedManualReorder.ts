
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
  isMilestoneView: boolean = false,
  addImpliedBattle?: (winnerId: number, loserId: number) => void
) => {
  const { updateRating, getRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] ===== HOOK INITIALIZATION =====');
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] finalRankings length:', finalRankings.length);

  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedPokemonId: null as number | null,
    isUpdating: false,
    manualAdjustmentInProgress: false
  });

  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  // Initialize local rankings once with proper name formatting
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current && finalRankings.length > 0) {
      console.log('🔥 [ENHANCED_REORDER] Initializing local rankings with name formatting');
      const formattedRankings = finalRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      setLocalRankings(formattedRankings);
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
      console.log('🔥 [ENHANCED_REORDER] Updating local rankings from final rankings with name formatting');
      const formattedRankings = finalRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      setLocalRankings(formattedRankings);
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

  const forceScoreBetweenNeighbors = useCallback((
    draggedPokemon: RankedPokemon, 
    targetPosition: number,
    currentRankings: RankedPokemon[]
  ) => {
    const operationId = `FORCE_SCORE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔥🔥🔥 [${operationId}] ===== FORCING SCORE BETWEEN NEIGHBORS =====`);
    console.log(`🔥🔥🔥 [${operationId}] Pokemon: ${draggedPokemon.name} (ID: ${draggedPokemon.id})`);
    console.log(`🔥🔥🔥 [${operationId}] Target position: ${targetPosition}`);
    
    // Get neighbors at the target position
    const abovePokemon = targetPosition > 0 ? currentRankings[targetPosition - 1] : null;
    const belowPokemon = targetPosition < currentRankings.length ? currentRankings[targetPosition] : null;
    
    console.log(`🔥🔥🔥 [${operationId}] Above: ${abovePokemon ? `${abovePokemon.name} (${abovePokemon.score.toFixed(5)})` : 'None'}`);
    console.log(`🔥🔥🔥 [${operationId}] Below: ${belowPokemon ? `${belowPokemon.name} (${belowPokemon.score.toFixed(5)})` : 'None'}`);

    // 🟢 Step 1: Explicitly detect identical neighbor scores
    if (abovePokemon && belowPokemon) {
      const EPSILON = 0.00001;
      const aboveDisplayedScore = abovePokemon.rating ? (abovePokemon.rating.mu - abovePokemon.rating.sigma) : abovePokemon.score;
      const belowDisplayedScore = belowPokemon.rating ? (belowPokemon.rating.mu - belowPokemon.rating.sigma) : belowPokemon.score;
      
      const identicalScores = Math.abs(aboveDisplayedScore - belowDisplayedScore) < EPSILON;
      console.log(`🚨 [${operationId}] Identical score scenario explicitly detected:`, identicalScores);
      console.log(`🚨 [${operationId}] Above displayed score: ${aboveDisplayedScore.toFixed(6)}`);
      console.log(`🚨 [${operationId}] Below displayed score: ${belowDisplayedScore.toFixed(6)}`);
      
      if (identicalScores) {
        // 🔵 Step 2: Explicitly identify groups with identical scores
        const aboveGroup: RankedPokemon[] = [];
        const belowGroup: RankedPokemon[] = [];
        
        // Build above group - all Pokemon immediately above with same displayed score
        for (let i = targetPosition - 1; i >= 0; i--) {
          const pokemon = currentRankings[i];
          const pokemonDisplayedScore = pokemon.rating ? (pokemon.rating.mu - pokemon.rating.sigma) : pokemon.score;
          if (Math.abs(pokemonDisplayedScore - aboveDisplayedScore) < EPSILON) {
            aboveGroup.unshift(pokemon);
          } else {
            break;
          }
        }
        
        // Build below group - all Pokemon immediately below with same displayed score
        for (let i = targetPosition; i < currentRankings.length; i++) {
          const pokemon = currentRankings[i];
          const pokemonDisplayedScore = pokemon.rating ? (pokemon.rating.mu - pokemon.rating.sigma) : pokemon.score;
          if (Math.abs(pokemonDisplayedScore - belowDisplayedScore) < EPSILON) {
            belowGroup.push(pokemon);
          } else {
            break;
          }
        }
        
        console.log(`📌 [${operationId}] Above group explicitly: [${aboveGroup.map(p => `${p.name} (${(p.rating?.mu - p.rating?.sigma || p.score).toFixed(3)})`).join(', ')}]`);
        console.log(`📌 [${operationId}] Below group explicitly: [${belowGroup.map(p => `${p.name} (${(p.rating?.mu - p.rating?.sigma || p.score).toFixed(3)})`).join(', ')}]`);
        
        // 🟡 Step 3: Carefully adjust scores of the tied groups
        const currentIndexAboveGroup = currentRankings.indexOf(aboveGroup[0]);
        const currentIndexBelowGroup = currentRankings.indexOf(belowGroup[belowGroup.length - 1]);
        
        // Explicit next higher displayed score calculation
        let nextHigherDisplayedScore;
        if (currentIndexAboveGroup > 0) {
          const nextHigherPokemon = currentRankings[currentIndexAboveGroup - 1];
          nextHigherDisplayedScore = nextHigherPokemon.rating ? (nextHigherPokemon.rating.mu - nextHigherPokemon.rating.sigma) : nextHigherPokemon.score;
        } else {
          nextHigherDisplayedScore = aboveDisplayedScore + 0.5; // Explicit small increment
        }
        
        // Explicit next lower displayed score calculation
        let nextLowerDisplayedScore;
        if (currentIndexBelowGroup < currentRankings.length - 1) {
          const nextLowerPokemon = currentRankings[currentIndexBelowGroup + 1];
          nextLowerDisplayedScore = nextLowerPokemon.rating ? (nextLowerPokemon.rating.mu - nextLowerPokemon.rating.sigma) : nextLowerPokemon.score;
        } else {
          nextLowerDisplayedScore = belowDisplayedScore - 0.5; // Explicit small decrement
        }
        
        console.log(`📌 [${operationId}] Next higher displayed score: ${nextHigherDisplayedScore.toFixed(6)}`);
        console.log(`📌 [${operationId}] Next lower displayed score: ${nextLowerDisplayedScore.toFixed(6)}`);
        
        // Adjust Above Group explicitly
        const newAboveDisplayedScore = (aboveDisplayedScore + nextHigherDisplayedScore) / 2;
        console.log(`📌 [${operationId}] Above group explicitly adjusted from ${aboveDisplayedScore.toFixed(6)} to ${newAboveDisplayedScore.toFixed(6)}`);
        
        aboveGroup.forEach(pokemon => {
          const currentRating = getRating(pokemon.id.toString());
          const newMu = newAboveDisplayedScore + currentRating.sigma;
          const newRating = new Rating(newMu, currentRating.sigma);
          updateRating(pokemon.id.toString(), newRating);
          console.log(`📌 [${operationId}] Above group ${pokemon.name}: μ=${newMu.toFixed(3)}, σ=${currentRating.sigma.toFixed(3)}`);
        });
        
        // Adjust Below Group explicitly
        const newBelowDisplayedScore = (belowDisplayedScore + nextLowerDisplayedScore) / 2;
        console.log(`📌 [${operationId}] Below group explicitly adjusted from ${belowDisplayedScore.toFixed(6)} to ${newBelowDisplayedScore.toFixed(6)}`);
        
        belowGroup.forEach(pokemon => {
          const currentRating = getRating(pokemon.id.toString());
          const newMu = newBelowDisplayedScore + currentRating.sigma;
          const newRating = new Rating(newMu, currentRating.sigma);
          updateRating(pokemon.id.toString(), newRating);
          console.log(`📌 [${operationId}] Below group ${pokemon.name}: μ=${newMu.toFixed(3)}, σ=${currentRating.sigma.toFixed(3)}`);
        });
        
        // 🟠 Step 4: Explicitly set dragged Pokemon's score
        const MIN_SIGMA = 1.0;
        const currentDraggedRating = getRating(draggedPokemon.id.toString());
        const newSigma = Math.max(currentDraggedRating.sigma * 0.8, MIN_SIGMA); // Reduce sigma by 20%
        const newMu = aboveDisplayedScore + newSigma; // Maintain exact original displayed score
        const newDraggedRating = new Rating(newMu, newSigma);
        updateRating(draggedPokemon.id.toString(), newDraggedRating);
        
        console.log(`✅ [${operationId}] Dragged Pokemon explicitly adjusted: ${draggedPokemon.name} new μ: ${newMu.toFixed(6)} new σ: ${newSigma.toFixed(6)}`);
        
        return; // Early return for identical scores case
      }
    }
    
    // Standard case - no identical scores
    let targetScore: number;
    
    if (abovePokemon && belowPokemon) {
      // Between two Pokemon - use exact average
      targetScore = (abovePokemon.score + belowPokemon.score) / 2;
      console.log(`🔥🔥🔥 [${operationId}] BETWEEN: (${abovePokemon.score.toFixed(5)} + ${belowPokemon.score.toFixed(5)}) / 2 = ${targetScore.toFixed(5)}`);
    } else if (abovePokemon) {
      // At bottom - slightly below
      targetScore = abovePokemon.score - 1.0;
      console.log(`🔥🔥🔥 [${operationId}] BOTTOM: ${abovePokemon.score.toFixed(5)} - 1.0 = ${targetScore.toFixed(5)}`);
    } else if (belowPokemon) {
      // At top - slightly above
      targetScore = belowPokemon.score + 1.0;
      console.log(`🔥🔥🔥 [${operationId}] TOP: ${belowPokemon.score.toFixed(5)} + 1.0 = ${targetScore.toFixed(5)}`);
    } else {
      // Single Pokemon
      targetScore = 25.0;
      console.log(`🔥🔥🔥 [${operationId}] SINGLE: default = ${targetScore}`);
    }
    
    // Force the exact score by setting mu and sigma
    const newSigma = 1.0; // Low sigma for high confidence
    const newMu = targetScore + newSigma; // mu = score + sigma so score = mu - sigma
    
    console.log(`🔥🔥🔥 [${operationId}] FORCING: μ=${newMu.toFixed(5)}, σ=${newSigma.toFixed(5)}, score=${targetScore.toFixed(5)}`);
    
    const newRating = new Rating(newMu, newSigma);
    updateRating(draggedPokemon.id.toString(), newRating);
    
    console.log(`🔥🔥🔥 [${operationId}] ✅ SCORE FORCED SUCCESSFULLY`);
  }, [updateRating, getRating]);

  const recalculateAllScores = useCallback((rankings: RankedPokemon[]): RankedPokemon[] => {
    console.log('🔥 [RECALC_SCORES] ===== RECALCULATING ALL SCORES =====');
    
    const updated = rankings.map((pokemon) => {
      const rating = getRating(pokemon.id.toString());
      const newScore = rating.mu - rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      
      console.log(`🔥 [RECALC_SCORES] ${pokemon.name}: old=${pokemon.score.toFixed(3)}, new=${newScore.toFixed(3)}`);
      
      return {
        ...pokemon,
        name: formatPokemonName(pokemon.name), // Ensure name formatting is applied
        score: newScore,
        confidence: confidence,
        rating: rating,
        count: pokemon.count || 0
      };
    });
    
    // 🔴 Step 5: Explicitly resort the rankings immediately
    const sorted = updated.sort((a, b) => b.score - a.score);
    console.log('🔥 [RECALC_SCORES] ===== SCORES RECALCULATED AND EXPLICITLY SORTED =====');
    return sorted;
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
    
    setDragState(prev => ({ ...prev, isUpdating: true, manualAdjustmentInProgress: true }));
    
    try {
      const oldIndex = localRankings.findIndex(p => p.id.toString() === active.id);
      const newIndex = localRankings.findIndex(p => p.id.toString() === over.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        console.error('🔥 [ENHANCED_REORDER_DRAG] Could not find Pokemon indices');
        return;
      }
      
      const movedPokemon = localRankings[oldIndex];
      console.log('🔥🔥🔥 [ENHANCED_REORDER_DRAG] Moving Pokemon:', movedPokemon.name, 'from', oldIndex, 'to', newIndex);
      
      // Create new rankings without the moved Pokemon
      const withoutMoved = localRankings.filter(p => p.id !== movedPokemon.id);
      
      // Force the score to fit at the target position
      forceScoreBetweenNeighbors(movedPokemon, newIndex, withoutMoved);
      
      // Recalculate all scores and sort
      const updatedRankings = recalculateAllScores(localRankings);
      
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
  }, [localRankings, forceScoreBetweenNeighbors, recalculateAllScores, onRankingsUpdate]);

  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ===== MANUAL REORDER CALLED =====');
    console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] Pokemon ID:', draggedPokemonId, 'from', sourceIndex, 'to', destinationIndex);
    
    setDragState(prev => ({ ...prev, isUpdating: true, manualAdjustmentInProgress: true }));
    
    try {
      if (sourceIndex === -1) {
        // Adding new Pokemon
        console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ✅ ADDING NEW POKEMON');
        
        const pokemonData = pokemonLookupMap.get(draggedPokemonId);
        if (!pokemonData) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Pokemon not found:', draggedPokemonId);
          return;
        }
        
        // Apply name formatting when creating new Pokemon entry
        const formattedPokemonData = {
          ...pokemonData,
          name: formatPokemonName(pokemonData.name),
          score: 0,
          confidence: 0,
          rating: getRating(draggedPokemonId.toString()),
          count: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };
        
        // Force score at target position
        forceScoreBetweenNeighbors(
          formattedPokemonData,
          destinationIndex,
          localRankings
        );
        
      } else {
        // Reordering existing Pokemon
        console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ✅ REORDERING EXISTING POKEMON');
        
        const movedPokemon = localRankings[sourceIndex];
        const withoutMoved = localRankings.filter(p => p.id !== movedPokemon.id);
        
        // Force score at target position
        forceScoreBetweenNeighbors(movedPokemon, destinationIndex, withoutMoved);
      }
      
      // Recalculate all scores and sort
      const updatedRankings = recalculateAllScores(localRankings);
      
      setLocalRankings(updatedRankings);
      onRankingsUpdate(updatedRankings);
      
      console.log('🔥🔥🔥 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder completed');
      
    } catch (error) {
      console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Error:', error);
    } finally {
      setTimeout(() => {
        setDragState(prev => ({ ...prev, isUpdating: false, manualAdjustmentInProgress: false }));
      }, 100);
    }
  }, [localRankings, pokemonLookupMap, getRating, forceScoreBetweenNeighbors, recalculateAllScores, onRankingsUpdate]);

  const displayRankings = useMemo(() => {
    return localRankings.map((pokemon) => ({
      ...pokemon,
      name: formatPokemonName(pokemon.name), // Ensure formatting is applied in display
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
