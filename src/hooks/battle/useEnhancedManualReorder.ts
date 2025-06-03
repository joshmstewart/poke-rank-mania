
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from '@/services/pokemon';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { Rating } from 'ts-trueskill';
import { useRenderTracker } from './useRenderTracker';

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (newRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean,
  addImpliedBattle?: (winnerId: number, loserId: number) => void
) => {
  // Track renders for performance debugging
  useRenderTracker('useEnhancedManualReorder', { 
    rankingsCount: finalRankings.length,
    preventAutoResorting 
  });

  const { updateRating, getRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] ===== HOOK INITIALIZATION =====');
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] finalRankings length:', finalRankings.length);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] onRankingsUpdate exists:', !!onRankingsUpdate);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] preventAutoResorting:', preventAutoResorting);

  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>(finalRankings);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPokemonId, setDraggedPokemonId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Stable refs to prevent recreation
  const onRankingsUpdateRef = useRef(onRankingsUpdate);
  onRankingsUpdateRef.current = onRankingsUpdate;

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

  // PERFORMANCE FIX: Defer heavy TrueSkill calculations
  const applyTrueSkillUpdates = useCallback((
    winnerPokemon: RankedPokemon, 
    loserPokemon: RankedPokemon,
    rankDifference: number
  ) => {
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] Applying TrueSkill updates...');
    
    // Get current ratings
    const winnerRating = getRating(winnerPokemon.id.toString());
    const loserRating = getRating(loserPokemon.id.toString());
    
    // Calculate rating adjustments based on rank difference
    const baseAdjustment = Math.min(3, Math.max(0.5, rankDifference / 10));
    
    // Create new ratings
    const newWinnerRating = new Rating(
      winnerRating.mu + baseAdjustment,
      Math.max(winnerRating.sigma * 0.95, 1.0)
    );
    
    const newLoserRating = new Rating(
      loserRating.mu - baseAdjustment,
      Math.max(loserRating.sigma * 0.95, 1.0)
    );
    
    // Update the ratings in the store
    updateRating(winnerPokemon.id.toString(), newWinnerRating);
    updateRating(loserPokemon.id.toString(), newLoserRating);
    
    console.log('🔥 [ENHANCED_REORDER_TRUESKILL] TrueSkill ratings updated successfully');
  }, [getRating, updateRating]);

  // PERFORMANCE FIX: Only recalculate affected Pokemon scores
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
    
    const oldIndex = localRankings.findIndex(p => p.id.toString() === active.id);
    const newIndex = localRankings.findIndex(p => p.id.toString() === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.error('🔥 [ENHANCED_REORDER_DRAG] Could not find Pokemon indices');
      return;
    }
    
    const movedPokemon = localRankings[oldIndex];
    
    // PERFORMANCE FIX: Immediate optimistic update
    const newRankings = arrayMove(localRankings, oldIndex, newIndex);
    setLocalRankings(newRankings);
    onRankingsUpdateRef.current(newRankings);
    
    // PERFORMANCE FIX: Defer heavy calculations
    setTimeout(() => {
      setIsUpdating(true);
      
      try {
        if (!validateRankingsIntegrity(newRankings)) {
          console.error('🔥 [ENHANCED_REORDER_DRAG] Rankings integrity check failed');
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
        setLocalRankings(updatedRankings);
        onRankingsUpdateRef.current(updatedRankings);
        
        console.log('🔥 [ENHANCED_REORDER_DRAG] ✅ Deferred processing complete');
        
      } catch (error) {
        console.error('🔥 [ENHANCED_REORDER_DRAG] Error during deferred processing:', error);
      } finally {
        setIsUpdating(false);
      }
    }, 0);
  }, [localRankings, validateRankingsIntegrity, applyTrueSkillUpdates, addImpliedBattle, recalculateScores]);

  // PERFORMANCE FIX: Optimized manual reorder with deferred heavy operations
  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Manual reorder called:', draggedPokemonId, sourceIndex, destinationIndex);
    
    // Immediate optimistic update
    const newRankings = arrayMove(localRankings, sourceIndex, destinationIndex);
    setLocalRankings(newRankings);
    onRankingsUpdateRef.current(newRankings);
    
    // Defer heavy calculations
    setTimeout(() => {
      setIsUpdating(true);
      
      try {
        if (!validateRankingsIntegrity(newRankings)) {
          console.error('🔥 [ENHANCED_MANUAL_REORDER] Rankings integrity check failed');
          return;
        }
        
        const updatedRankings = recalculateScores(newRankings);
        setLocalRankings(updatedRankings);
        onRankingsUpdateRef.current(updatedRankings);
        
        console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder completed');
        
      } catch (error) {
        console.error('🔥 [ENHANCED_MANUAL_REORDER] Error during manual reorder:', error);
      } finally {
        setIsUpdating(false);
      }
    }, 0);
  }, [localRankings, validateRankingsIntegrity, recalculateScores]);

  // PERFORMANCE FIX: Memoize display rankings to prevent recreation
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
