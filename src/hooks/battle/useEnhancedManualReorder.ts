
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
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] onRankingsUpdate exists:', !!onRankingsUpdate);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] preventAutoResorting:', preventAutoResorting);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] addImpliedBattle exists:', !!addImpliedBattle);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] pokemonLookupMap size:', pokemonLookupMap.size);

  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>(finalRankings);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPokemonId, setDraggedPokemonId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update local rankings when final rankings change (but not during drag)
  useEffect(() => {
    if (!isDragging && !isUpdating) {
      setLocalRankings(finalRankings);
    }
  }, [finalRankings, isDragging, isUpdating]);

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

  const applyTrueSkillUpdates = useCallback((
    winnerPokemon: RankedPokemon, 
    loserPokemon: RankedPokemon,
    rankDifference: number
  ) => {
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] Applying TrueSkill updates...');
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] Winner:', winnerPokemon.name, 'vs Loser:', loserPokemon.name);
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] Rank difference:', rankDifference);
    
    // Get current ratings
    const winnerRating = getRating(winnerPokemon.id.toString());
    const loserRating = getRating(loserPokemon.id.toString());
    
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] Current ratings - Winner:', 
      `μ=${winnerRating.mu.toFixed(2)}, σ=${winnerRating.sigma.toFixed(2)}`);
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] Current ratings - Loser:', 
      `μ=${loserRating.mu.toFixed(2)}, σ=${loserRating.sigma.toFixed(2)}`);
    
    // Calculate rating adjustments based on rank difference
    const baseAdjustment = Math.min(3, Math.max(0.5, rankDifference / 10));
    const winnerAdjustment = baseAdjustment;
    const loserAdjustment = baseAdjustment;
    
    // Create new ratings
    const newWinnerRating = new Rating(
      winnerRating.mu + winnerAdjustment,
      Math.max(winnerRating.sigma * 0.95, 1.0)
    );
    
    const newLoserRating = new Rating(
      loserRating.mu - loserAdjustment,
      Math.max(loserRating.sigma * 0.95, 1.0)
    );
    
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] New ratings - Winner:', 
      `μ=${newWinnerRating.mu.toFixed(2)}, σ=${newWinnerRating.sigma.toFixed(2)}`);
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] New ratings - Loser:', 
      `μ=${newLoserRating.mu.toFixed(2)}, σ=${newLoserRating.sigma.toFixed(2)}`);
    
    // Update the ratings in the store
    updateRating(winnerPokemon.id.toString(), newWinnerRating);
    updateRating(loserPokemon.id.toString(), newLoserRating);
    
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] TrueSkill ratings updated successfully');
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
        mu: rating.mu,
        sigma: rating.sigma,
        count: pokemon.count || 0
      };
    });
  }, [getRating]);

  const handleDragStart = useCallback((event: any) => {
    const draggedId = parseInt(event.active.id);
    setIsDragging(true);
    setDraggedPokemonId(draggedId);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Drag started for Pokemon ID:', draggedId);
  }, []);

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
      
      // Apply TrueSkill updates for affected Pokemon
      const rankDifference = Math.abs(newIndex - oldIndex);
      if (rankDifference > 0 && addImpliedBattle) {
        if (newIndex < oldIndex) {
          // Moved up - this Pokemon beats the ones it moved past
          for (let i = newIndex; i < oldIndex; i++) {
            const beatenPokemon = newRankings[i + 1];
            if (beatenPokemon && beatenPokemon.id !== movedPokemon.id) {
              applyTrueSkillUpdates(movedPokemon, beatenPokemon, 1);
              addImpliedBattle(movedPokemon.id, beatenPokemon.id);
            }
          }
        } else {
          // Moved down - the ones it moved past beat this Pokemon
          for (let i = oldIndex + 1; i <= newIndex; i++) {
            const winnerPokemon = newRankings[i - 1];
            if (winnerPokemon && winnerPokemon.id !== movedPokemon.id) {
              applyTrueSkillUpdates(winnerPokemon, movedPokemon, 1);
              addImpliedBattle(winnerPokemon.id, movedPokemon.id);
            }
          }
        }
      }
      
      // Recalculate scores with updated TrueSkill ratings
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
  }, [localRankings, validateRankingsIntegrity, applyTrueSkillUpdates, addImpliedBattle, recalculateScores, onRankingsUpdate]);

  // FIXED: Enhanced manual reorder function that handles both new additions and reordering
  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log('🔥 [ENHANCED_MANUAL_REORDER] ===== MANUAL REORDER CALLED =====');
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Pokemon ID:', draggedPokemonId);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Source Index:', sourceIndex);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Destination Index:', destinationIndex);
    
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
          mu: rating.mu,
          sigma: rating.sigma,
          count: 0
        };
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] New Pokemon object:', newRankedPokemon.name, 'Score:', newRankedPokemon.score);
        
        // Insert at the specified position
        newRankings = [...localRankings];
        newRankings.splice(destinationIndex, 0, newRankedPokemon);
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Inserted at index', destinationIndex, 'New length:', newRankings.length);
        
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
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Moved from', sourceIndex, 'to', destinationIndex);
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
  }, [localRankings, pokemonLookupMap, getRating, validateRankingsIntegrity, recalculateScores, onRankingsUpdate]);

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
