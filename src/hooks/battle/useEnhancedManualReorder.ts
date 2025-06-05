
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

  // Battle simulation that updates TrueSkill ratings but PRESERVES manual order
  const simulateBattlesForReorder = useCallback((
    reorderedRankings: RankedPokemon[],
    movedPokemon: RankedPokemon,
    oldIndex: number,
    newIndex: number
  ) => {
    console.log('🔥🔥🔥 [BATTLE_SIMULATION] ===== SIMULATING BATTLES FOR REORDER =====');
    console.log('🔥🔥🔥 [BATTLE_SIMULATION] Pokemon:', movedPokemon.name, 'moved from', oldIndex, 'to', newIndex);
    console.log('🔥🔥🔥 [BATTLE_SIMULATION] preventAutoResorting:', preventAutoResorting);
    
    let battlesSimulated = 0;
    
    if (newIndex < oldIndex) {
      // Pokemon moved up - it should beat Pokemon it moved past
      console.log('🔥🔥🔥 [BATTLE_SIMULATION] Pokemon moved UP - simulating wins');
      for (let i = newIndex; i < oldIndex; i++) {
        const opponent = reorderedRankings[i + 1];
        if (opponent && opponent.id !== movedPokemon.id) {
          // Get current ratings
          const winnerRating = getRating(movedPokemon.id.toString());
          const loserRating = getRating(opponent.id.toString());
          
          // Calculate new ratings - winner gains, loser loses
          const ratingChange = Math.min(2.0, Math.max(0.5, Math.abs(oldIndex - newIndex) / 10));
          
          const newWinnerRating = new Rating(
            winnerRating.mu + ratingChange,
            Math.max(winnerRating.sigma * 0.9, 1.0)
          );
          
          const newLoserRating = new Rating(
            loserRating.mu - ratingChange,
            Math.max(loserRating.sigma * 0.9, 1.0)
          );
          
          // Update ratings in TrueSkill store
          updateRating(movedPokemon.id.toString(), newWinnerRating);
          updateRating(opponent.id.toString(), newLoserRating);
          
          console.log('🔥🔥🔥 [BATTLE_SIMULATION] Battle:', movedPokemon.name, 'BEATS', opponent.name);
          battlesSimulated++;
          
          // Add implied battle if function exists
          if (addImpliedBattle) {
            addImpliedBattle(movedPokemon.id, opponent.id);
          }
        }
      }
    } else if (newIndex > oldIndex) {
      // Pokemon moved down - Pokemon it moved past should beat it
      console.log('🔥🔥🔥 [BATTLE_SIMULATION] Pokemon moved DOWN - simulating losses');
      for (let i = oldIndex + 1; i <= newIndex; i++) {
        const opponent = reorderedRankings[i - 1];
        if (opponent && opponent.id !== movedPokemon.id) {
          // Get current ratings
          const winnerRating = getRating(opponent.id.toString());
          const loserRating = getRating(movedPokemon.id.toString());
          
          // Calculate new ratings
          const ratingChange = Math.min(2.0, Math.max(0.5, Math.abs(newIndex - oldIndex) / 10));
          
          const newWinnerRating = new Rating(
            winnerRating.mu + ratingChange,
            Math.max(winnerRating.sigma * 0.9, 1.0)
          );
          
          const newLoserRating = new Rating(
            loserRating.mu - ratingChange,
            Math.max(loserRating.sigma * 0.9, 1.0)
          );
          
          // Update ratings in TrueSkill store
          updateRating(opponent.id.toString(), newWinnerRating);
          updateRating(movedPokemon.id.toString(), newLoserRating);
          
          console.log('🔥🔥🔥 [BATTLE_SIMULATION]', opponent.name, 'BEATS', movedPokemon.name);
          battlesSimulated++;
          
          // Add implied battle if function exists
          if (addImpliedBattle) {
            addImpliedBattle(opponent.id, movedPokemon.id);
          }
        }
      }
    }
    
    console.log('🔥🔥🔥 [BATTLE_SIMULATION] ✅ Simulated', battlesSimulated, 'battles');
    return battlesSimulated;
  }, [getRating, updateRating, addImpliedBattle, preventAutoResorting]);

  // CRITICAL FIX: ABSOLUTELY preserve order when preventAutoResorting is true
  const updateScoresPreservingOrder = useCallback((rankings: RankedPokemon[]): RankedPokemon[] => {
    console.log('🔥 [PRESERVE_ORDER] ===== UPDATING SCORES WHILE PRESERVING ORDER =====');
    console.log('🔥 [PRESERVE_ORDER] preventAutoResorting:', preventAutoResorting);
    console.log('🔥 [PRESERVE_ORDER] Input order:', rankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    // CRITICAL: Create new array with updated scores but EXACT SAME ORDER
    const updatedRankings = rankings.map((pokemon, index) => {
      const rating = getRating(pokemon.id.toString());
      const conservativeEstimate = rating.mu - rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      
      console.log(`🔥 [PRESERVE_ORDER] ${index+1}. ${pokemon.name}: score ${pokemon.score.toFixed(2)} → ${conservativeEstimate.toFixed(2)}`);
      
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
    
    console.log('🔥 [PRESERVE_ORDER] FINAL Output order (MUST MATCH INPUT):', updatedRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    console.log('🔥 [PRESERVE_ORDER] ===== ORDER PRESERVATION COMPLETE =====');
    
    // ABSOLUTELY NO SORTING when preventAutoResorting is true
    if (preventAutoResorting) {
      console.log('🔥 [PRESERVE_ORDER] ✅ MANUAL ORDER PRESERVED - NO SORTING APPLIED');
      return updatedRankings;
    } else {
      console.log('🔥 [PRESERVE_ORDER] ⚠️ Auto-resorting enabled - sorting by score');
      return updatedRankings.sort((a, b) => b.score - a.score);
    }
  }, [getRating, preventAutoResorting]);

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
    console.log('🔥 [ENHANCED_REORDER_DRAG] BEFORE DRAG - Current order:', localRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    const oldIndex = localRankings.findIndex(p => p.id.toString() === active.id);
    const newIndex = localRankings.findIndex(p => p.id.toString() === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.error('🔥 [ENHANCED_REORDER_DRAG] Could not find Pokemon indices');
      return;
    }
    
    const movedPokemon = localRankings[oldIndex];
    console.log('🔥 [ENHANCED_REORDER_DRAG] Moving:', movedPokemon.name, 'from position', oldIndex + 1, 'to position', newIndex + 1);
    
    // Create new rankings with manual order - THIS IS THE USER'S INTENDED ORDER
    const newRankings = arrayMove(localRankings, oldIndex, newIndex);
    console.log('🔥 [ENHANCED_REORDER_DRAG] AFTER MANUAL MOVE - New order:', newRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    console.log('🔥 [ENHANCED_REORDER_DRAG] ===== STARTING BATTLE SIMULATION =====');
    
    // Simulate battles and update TrueSkill ratings
    const battlesSimulated = simulateBattlesForReorder(newRankings, movedPokemon, oldIndex, newIndex);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Battles simulated:', battlesSimulated);
    
    // CRITICAL: ALWAYS preserve manual order, just update scores
    const updatedRankings = updateScoresPreservingOrder(newRankings);
    
    console.log('🔥 [ENHANCED_REORDER_DRAG] FINAL ORDER CHECK (MUST MATCH MANUAL ORDER):');
    console.log('🔥 [ENHANCED_REORDER_DRAG] Manual order was:', newRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    console.log('🔥 [ENHANCED_REORDER_DRAG] Final order is:', updatedRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    // Verify order preservation
    const orderPreserved = newRankings.every((pokemon, index) => updatedRankings[index].id === pokemon.id);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Order preserved correctly:', orderPreserved);
    
    if (!orderPreserved) {
      console.error('🔥 [ENHANCED_REORDER_DRAG] ❌ ORDER WAS NOT PRESERVED! This is the bug!');
      console.error('🔥 [ENHANCED_REORDER_DRAG] Expected order:', newRankings.map(p => p.id));
      console.error('🔥 [ENHANCED_REORDER_DRAG] Actual order:', updatedRankings.map(p => p.id));
    } else {
      console.log('🔥 [ENHANCED_REORDER_DRAG] ✅ Order correctly preserved');
    }
    
    // Update state
    setLocalRankings(updatedRankings);
    onRankingsUpdateRef.current(updatedRankings);
    
    console.log('🔥 [ENHANCED_REORDER_DRAG] ✅ Drag processing complete');
  }, [localRankings, validateRankingsIntegrity, simulateBattlesForReorder, updateScoresPreservingOrder, preventAutoResorting]);

  // CRITICAL: Manual reorder with GUARANTEED order preservation
  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log('🔥 [ENHANCED_MANUAL_REORDER] ===== MANUAL REORDER CALLED =====');
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Pokemon:', draggedPokemonId, 'from', sourceIndex, 'to', destinationIndex);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] preventAutoResorting:', preventAutoResorting);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] BEFORE REORDER - Current order:', localRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    const movedPokemon = localRankings[sourceIndex];
    if (!movedPokemon) {
      console.error('🔥 [ENHANCED_MANUAL_REORDER] Pokemon not found at source index');
      return;
    }
    
    // Create new rankings with manual order - THIS IS THE USER'S INTENDED ORDER
    const newRankings = arrayMove(localRankings, sourceIndex, destinationIndex);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] AFTER MANUAL MOVE - New order:', newRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    console.log('🔥 [ENHANCED_MANUAL_REORDER] ===== STARTING BATTLE SIMULATION =====');
    
    // Simulate battles and update TrueSkill ratings
    const battlesSimulated = simulateBattlesForReorder(newRankings, movedPokemon, sourceIndex, destinationIndex);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Battles simulated:', battlesSimulated);
    
    // CRITICAL: ALWAYS preserve manual order, just update scores
    const updatedRankings = updateScoresPreservingOrder(newRankings);
    
    console.log('🔥 [ENHANCED_MANUAL_REORDER] FINAL ORDER CHECK (MUST MATCH MANUAL ORDER):');
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Manual order was:', newRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Final order is:', updatedRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    // Verify order preservation
    const orderPreserved = newRankings.every((pokemon, index) => updatedRankings[index].id === pokemon.id);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Order preserved correctly:', orderPreserved);
    
    if (!orderPreserved) {
      console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ ORDER WAS NOT PRESERVED! This is the bug!');
      console.error('🔥 [ENHANCED_MANUAL_REORDER] Expected order:', newRankings.map(p => p.id));
      console.error('🔥 [ENHANCED_MANUAL_REORDER] Actual order:', updatedRankings.map(p => p.id));
    } else {
      console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Order correctly preserved');
    }
    
    // Update state
    setLocalRankings(updatedRankings);
    onRankingsUpdateRef.current(updatedRankings);
    
    console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder complete');
  }, [localRankings, validateRankingsIntegrity, simulateBattlesForReorder, updateScoresPreservingOrder, preventAutoResorting]);

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
