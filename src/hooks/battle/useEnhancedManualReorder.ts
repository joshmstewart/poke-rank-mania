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
  const perfStart = performance.now();
  console.log('🎯 [PERF_HOOK_START] useEnhancedManualReorder execution started');

  // Track renders for performance debugging
  useRenderTracker('useEnhancedManualReorder', { 
    rankingsCount: finalRankings.length,
    preventAutoResorting 
  });

  const perfAfterRenderTracker = performance.now();
  console.log(`🎯 [PERF_RENDER_TRACKER] Time: ${(perfAfterRenderTracker - perfStart).toFixed(2)}ms`);

  const { updateRating, getRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();

  const perfAfterStoreAccess = performance.now();
  console.log(`🎯 [PERF_STORE_ACCESS] Time: ${(perfAfterStoreAccess - perfAfterRenderTracker).toFixed(2)}ms`);
  
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] ===== HOOK INITIALIZATION =====');
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] finalRankings length:', finalRankings.length);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] onRankingsUpdate exists:', !!onRankingsUpdate);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] preventAutoResorting:', preventAutoResorting);

  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>(finalRankings);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPokemonId, setDraggedPokemonId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const perfAfterStateInit = performance.now();
  console.log(`🎯 [PERF_STATE_INIT] Time: ${(perfAfterStateInit - perfAfterStoreAccess).toFixed(2)}ms`);

  // Stable refs to prevent recreation
  const onRankingsUpdateRef = useRef(onRankingsUpdate);
  onRankingsUpdateRef.current = onRankingsUpdate;

  // Update local rankings when final rankings change (but not during drag)
  useEffect(() => {
    const perfEffectStart = performance.now();
    console.log('🎯 [PERF_EFFECT_START] Local rankings update effect triggered');
    
    if (!isDragging && !isUpdating) {
      setLocalRankings(finalRankings);
    }
    
    const perfEffectEnd = performance.now();
    console.log(`🎯 [PERF_EFFECT_END] Effect time: ${(perfEffectEnd - perfEffectStart).toFixed(2)}ms`);
  }, [finalRankings, isDragging, isUpdating]);

  const validateRankingsIntegrity = useCallback((rankings: RankedPokemon[]): boolean => {
    const perfValidationStart = performance.now();
    console.log('🎯 [PERF_VALIDATION_START] Rankings integrity validation started');
    
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
    
    const perfValidationEnd = performance.now();
    console.log(`🎯 [PERF_VALIDATION_END] Validation time: ${(perfValidationEnd - perfValidationStart).toFixed(2)}ms`);
    
    return true;
  }, []);

  // Battle simulation that updates TrueSkill ratings but PRESERVES manual order
  const simulateBattlesForReorder = useCallback((
    reorderedRankings: RankedPokemon[],
    movedPokemon: RankedPokemon,
    oldIndex: number,
    newIndex: number
  ) => {
    const perfBattleSimStart = performance.now();
    console.log('🎯 [PERF_BATTLE_SIM_START] Battle simulation started');
    console.log('🔥🔥🔥 [BATTLE_SIMULATION] ===== SIMULATING BATTLES FOR REORDER =====');
    console.log('🔥🔥🔥 [BATTLE_SIMULATION] Pokemon:', movedPokemon.name, 'moved from', oldIndex, 'to', newIndex);
    console.log('🔥🔥🔥 [BATTLE_SIMULATION] preventAutoResorting:', preventAutoResorting);
    
    let battlesSimulated = 0;
    
    if (newIndex < oldIndex) {
      const perfUpwardMoveStart = performance.now();
      console.log('🎯 [PERF_UPWARD_MOVE_START] Processing upward move battles');
      
      // Pokemon moved up - it should beat Pokemon it moved past
      console.log('🔥🔥🔥 [BATTLE_SIMULATION] Pokemon moved UP - simulating wins');
      for (let i = newIndex; i < oldIndex; i++) {
        const perfBattleLoopStart = performance.now();
        
        const opponent = reorderedRankings[i + 1];
        if (opponent && opponent.id !== movedPokemon.id) {
          // Get current ratings
          const perfRatingGetStart = performance.now();
          const winnerRating = getRating(movedPokemon.id.toString());
          const loserRating = getRating(opponent.id.toString());
          const perfRatingGetEnd = performance.now();
          console.log(`🎯 [PERF_RATING_GET] Battle ${i}: ${(perfRatingGetEnd - perfRatingGetStart).toFixed(2)}ms`);
          
          // Calculate new ratings - winner gains, loser loses
          const perfRatingCalcStart = performance.now();
          const ratingChange = Math.min(2.0, Math.max(0.5, Math.abs(oldIndex - newIndex) / 10));
          
          const newWinnerRating = new Rating(
            winnerRating.mu + ratingChange,
            Math.max(winnerRating.sigma * 0.9, 1.0)
          );
          
          const newLoserRating = new Rating(
            loserRating.mu - ratingChange,
            Math.max(loserRating.sigma * 0.9, 1.0)
          );
          const perfRatingCalcEnd = performance.now();
          console.log(`🎯 [PERF_RATING_CALC] Battle ${i}: ${(perfRatingCalcEnd - perfRatingCalcStart).toFixed(2)}ms`);
          
          // Update ratings in TrueSkill store
          const perfRatingUpdateStart = performance.now();
          updateRating(movedPokemon.id.toString(), newWinnerRating);
          updateRating(opponent.id.toString(), newLoserRating);
          const perfRatingUpdateEnd = performance.now();
          console.log(`🎯 [PERF_RATING_UPDATE] Battle ${i}: ${(perfRatingUpdateEnd - perfRatingUpdateStart).toFixed(2)}ms`);
          
          console.log('🔥🔥🔥 [BATTLE_SIMULATION] Battle:', movedPokemon.name, 'BEATS', opponent.name);
          battlesSimulated++;
          
          // Add implied battle if function exists
          if (addImpliedBattle) {
            const perfImpliedBattleStart = performance.now();
            addImpliedBattle(movedPokemon.id, opponent.id);
            const perfImpliedBattleEnd = performance.now();
            console.log(`🎯 [PERF_IMPLIED_BATTLE] Battle ${i}: ${(perfImpliedBattleEnd - perfImpliedBattleStart).toFixed(2)}ms`);
          }
        }
        
        const perfBattleLoopEnd = performance.now();
        console.log(`🎯 [PERF_BATTLE_LOOP] Battle ${i} total: ${(perfBattleLoopEnd - perfBattleLoopStart).toFixed(2)}ms`);
      }
      
      const perfUpwardMoveEnd = performance.now();
      console.log(`🎯 [PERF_UPWARD_MOVE_END] Upward move processing: ${(perfUpwardMoveEnd - perfUpwardMoveStart).toFixed(2)}ms`);
    } else if (newIndex > oldIndex) {
      const perfDownwardMoveStart = performance.now();
      console.log('🎯 [PERF_DOWNWARD_MOVE_START] Processing downward move battles');
      
      // Pokemon moved down - Pokemon it moved past should beat it
      console.log('🔥🔥🔥 [BATTLE_SIMULATION] Pokemon moved DOWN - simulating losses');
      for (let i = oldIndex + 1; i <= newIndex; i++) {
        const perfBattleLoopStart = performance.now();
        
        const opponent = reorderedRankings[i - 1];
        if (opponent && opponent.id !== movedPokemon.id) {
          // Get current ratings
          const perfRatingGetStart = performance.now();
          const winnerRating = getRating(opponent.id.toString());
          const loserRating = getRating(movedPokemon.id.toString());
          const perfRatingGetEnd = performance.now();
          console.log(`🎯 [PERF_RATING_GET] Battle ${i}: ${(perfRatingGetEnd - perfRatingGetStart).toFixed(2)}ms`);
          
          // Calculate new ratings
          const perfRatingCalcStart = performance.now();
          const ratingChange = Math.min(2.0, Math.max(0.5, Math.abs(newIndex - oldIndex) / 10));
          
          const newWinnerRating = new Rating(
            winnerRating.mu + ratingChange,
            Math.max(winnerRating.sigma * 0.9, 1.0)
          );
          
          const newLoserRating = new Rating(
            loserRating.mu - ratingChange,
            Math.max(loserRating.sigma * 0.9, 1.0)
          );
          const perfRatingCalcEnd = performance.now();
          console.log(`🎯 [PERF_RATING_CALC] Battle ${i}: ${(perfRatingCalcEnd - perfRatingCalcStart).toFixed(2)}ms`);
          
          // Update ratings in TrueSkill store
          const perfRatingUpdateStart = performance.now();
          updateRating(opponent.id.toString(), newWinnerRating);
          updateRating(movedPokemon.id.toString(), newLoserRating);
          const perfRatingUpdateEnd = performance.now();
          console.log(`🎯 [PERF_RATING_UPDATE] Battle ${i}: ${(perfRatingUpdateEnd - perfRatingUpdateStart).toFixed(2)}ms`);
          
          console.log('🔥🔥🔥 [BATTLE_SIMULATION]', opponent.name, 'BEATS', movedPokemon.name);
          battlesSimulated++;
          
          // Add implied battle if function exists
          if (addImpliedBattle) {
            const perfImpliedBattleStart = performance.now();
            addImpliedBattle(opponent.id, movedPokemon.id);
            const perfImpliedBattleEnd = performance.now();
            console.log(`🎯 [PERF_IMPLIED_BATTLE] Battle ${i}: ${(perfImpliedBattleEnd - perfImpliedBattleStart).toFixed(2)}ms`);
          }
        }
        
        const perfBattleLoopEnd = performance.now();
        console.log(`🎯 [PERF_BATTLE_LOOP] Battle ${i} total: ${(perfBattleLoopEnd - perfBattleLoopStart).toFixed(2)}ms`);
      }
      
      const perfDownwardMoveEnd = performance.now();
      console.log(`🎯 [PERF_DOWNWARD_MOVE_END] Downward move processing: ${(perfDownwardMoveEnd - perfDownwardMoveStart).toFixed(2)}ms`);
    }
    
    const perfBattleSimEnd = performance.now();
    console.log(`🎯 [PERF_BATTLE_SIM_END] Total battle simulation: ${(perfBattleSimEnd - perfBattleSimStart).toFixed(2)}ms`);
    console.log('🔥🔥🔥 [BATTLE_SIMULATION] ✅ Simulated', battlesSimulated, 'battles');
    return battlesSimulated;
  }, [getRating, updateRating, addImpliedBattle, preventAutoResorting]);

  // CRITICAL FIX: ABSOLUTELY preserve order when preventAutoResorting is true
  const updateScoresPreservingOrder = useCallback((rankings: RankedPokemon[]): RankedPokemon[] => {
    const perfScoreUpdateStart = performance.now();
    console.log('🎯 [PERF_SCORE_UPDATE_START] Score update started');
    console.log('🔥 [PRESERVE_ORDER] ===== UPDATING SCORES WHILE PRESERVING ORDER =====');
    console.log('🔥 [PRESERVE_ORDER] preventAutoResorting:', preventAutoResorting);
    console.log('🔥 [PRESERVE_ORDER] Input order:', rankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    // CRITICAL: Create new array with updated scores but EXACT SAME ORDER
    const perfMapStart = performance.now();
    const updatedRankings = rankings.map((pokemon, index) => {
      const perfItemStart = performance.now();
      
      const perfRatingGetStart = performance.now();
      const rating = getRating(pokemon.id.toString());
      const perfRatingGetEnd = performance.now();
      
      const perfCalcStart = performance.now();
      const conservativeEstimate = rating.mu - rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      const perfCalcEnd = performance.now();
      
      if (index < 5) { // Log first 5 items for detail
        console.log(`🎯 [PERF_ITEM_${index}] Rating get: ${(perfRatingGetEnd - perfRatingGetStart).toFixed(2)}ms, Calc: ${(perfCalcEnd - perfCalcStart).toFixed(2)}ms`);
      }
      
      console.log(`🔥 [PRESERVE_ORDER] ${index+1}. ${pokemon.name}: score ${pokemon.score.toFixed(2)} → ${conservativeEstimate.toFixed(2)}`);
      
      const result = {
        ...pokemon,
        score: conservativeEstimate,
        confidence: confidence,
        rating: rating,
        mu: rating.mu,
        sigma: rating.sigma,
        count: pokemon.count || 0
      };
      
      const perfItemEnd = performance.now();
      if (index < 5) { // Log first 5 items for detail
        console.log(`🎯 [PERF_ITEM_${index}_TOTAL] Total: ${(perfItemEnd - perfItemStart).toFixed(2)}ms`);
      }
      
      return result;
    });
    const perfMapEnd = performance.now();
    console.log(`🎯 [PERF_MAP_RANKINGS] Map operation: ${(perfMapEnd - perfMapStart).toFixed(2)}ms for ${rankings.length} items`);
    
    console.log('🔥 [PRESERVE_ORDER] FINAL Output order (MUST MATCH INPUT):', updatedRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    console.log('🔥 [PRESERVE_ORDER] ===== ORDER PRESERVATION COMPLETE =====');
    
    // ABSOLUTELY NO SORTING when preventAutoResorting is true
    const perfSortStart = performance.now();
    let finalResult;
    if (preventAutoResorting) {
      console.log('🔥 [PRESERVE_ORDER] ✅ MANUAL ORDER PRESERVED - NO SORTING APPLIED');
      finalResult = updatedRankings;
    } else {
      console.log('🔥 [PRESERVE_ORDER] ⚠️ Auto-resorting enabled - sorting by score');
      finalResult = updatedRankings.sort((a, b) => b.score - a.score);
    }
    const perfSortEnd = performance.now();
    console.log(`🎯 [PERF_SORT] Sort operation: ${(perfSortEnd - perfSortStart).toFixed(2)}ms`);
    
    const perfScoreUpdateEnd = performance.now();
    console.log(`🎯 [PERF_SCORE_UPDATE_END] Total score update: ${(perfScoreUpdateEnd - perfScoreUpdateStart).toFixed(2)}ms`);
    
    return finalResult;
  }, [getRating, preventAutoResorting]);

  const handleDragStart = useCallback((event: any) => {
    const perfDragStartBegin = performance.now();
    console.log('🎯 [PERF_DRAG_START_BEGIN] Drag start handler called');
    
    const draggedId = parseInt(event.active.id);
    setIsDragging(true);
    setDraggedPokemonId(draggedId);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Drag started for Pokemon ID:', draggedId);
    
    const perfDragStartEnd = performance.now();
    console.log(`🎯 [PERF_DRAG_START_END] Drag start handler: ${(perfDragStartEnd - perfDragStartBegin).toFixed(2)}ms`);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const perfDragEndBegin = performance.now();
    console.log('🎯 [PERF_DRAG_END_BEGIN] Drag end handler called');
    
    const { active, over } = event;
    
    setIsDragging(false);
    setDraggedPokemonId(null);
    
    if (!over || active.id === over.id) {
      console.log('🔥 [ENHANCED_REORDER_DRAG] Drag ended with no change');
      const perfDragEndEarly = performance.now();
      console.log(`🎯 [PERF_DRAG_END_EARLY] Early exit: ${(perfDragEndEarly - perfDragEndBegin).toFixed(2)}ms`);
      return;
    }

    console.log('🔥 [ENHANCED_REORDER_DRAG] ===== PROCESSING DRAG END =====');
    console.log('🔥 [ENHANCED_REORDER_DRAG] BEFORE DRAG - Current order:', localRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    const perfIndexFindStart = performance.now();
    const oldIndex = localRankings.findIndex(p => p.id.toString() === active.id);
    const newIndex = localRankings.findIndex(p => p.id.toString() === over.id);
    const perfIndexFindEnd = performance.now();
    console.log(`🎯 [PERF_INDEX_FIND] Index finding: ${(perfIndexFindEnd - perfIndexFindStart).toFixed(2)}ms`);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.error('🔥 [ENHANCED_REORDER_DRAG] Could not find Pokemon indices');
      return;
    }
    
    const movedPokemon = localRankings[oldIndex];
    console.log('🔥 [ENHANCED_REORDER_DRAG] Moving:', movedPokemon.name, 'from position', oldIndex + 1, 'to position', newIndex + 1);
    
    // Create new rankings with manual order - THIS IS THE USER'S INTENDED ORDER
    const perfArrayMoveStart = performance.now();
    const newRankings = arrayMove(localRankings, oldIndex, newIndex);
    const perfArrayMoveEnd = performance.now();
    console.log(`🎯 [PERF_ARRAY_MOVE] Array move: ${(perfArrayMoveEnd - perfArrayMoveStart).toFixed(2)}ms`);
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
    const perfOrderVerifyStart = performance.now();
    const orderPreserved = newRankings.every((pokemon, index) => updatedRankings[index].id === pokemon.id);
    const perfOrderVerifyEnd = performance.now();
    console.log(`🎯 [PERF_ORDER_VERIFY] Order verification: ${(perfOrderVerifyEnd - perfOrderVerifyStart).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Order preserved correctly:', orderPreserved);
    
    if (!orderPreserved) {
      console.error('🔥 [ENHANCED_REORDER_DRAG] ❌ ORDER WAS NOT PRESERVED! This is the bug!');
      console.error('🔥 [ENHANCED_REORDER_DRAG] Expected order:', newRankings.map(p => p.id));
      console.error('🔥 [ENHANCED_REORDER_DRAG] Actual order:', updatedRankings.map(p => p.id));
    } else {
      console.log('🔥 [ENHANCED_REORDER_DRAG] ✅ Order correctly preserved');
    }
    
    // Update state
    const perfStateUpdateStart = performance.now();
    setLocalRankings(updatedRankings);
    onRankingsUpdateRef.current(updatedRankings);
    const perfStateUpdateEnd = performance.now();
    console.log(`🎯 [PERF_STATE_UPDATE] State update: ${(perfStateUpdateEnd - perfStateUpdateStart).toFixed(2)}ms`);
    
    const perfDragEndComplete = performance.now();
    console.log(`🎯 [PERF_DRAG_END_COMPLETE] Total drag end processing: ${(perfDragEndComplete - perfDragEndBegin).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_REORDER_DRAG] ✅ Drag processing complete');
  }, [localRankings, validateRankingsIntegrity, simulateBattlesForReorder, updateScoresPreservingOrder, preventAutoResorting]);

  // CRITICAL: Manual reorder with GUARANTEED order preservation
  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const perfManualReorderStart = performance.now();
    console.log('🎯 [PERF_MANUAL_REORDER_START] Manual reorder called');
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
    const perfArrayMoveStart = performance.now();
    const newRankings = arrayMove(localRankings, sourceIndex, destinationIndex);
    const perfArrayMoveEnd = performance.now();
    console.log(`🎯 [PERF_MANUAL_ARRAY_MOVE] Array move: ${(perfArrayMoveEnd - perfArrayMoveStart).toFixed(2)}ms`);
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
    const perfOrderVerifyStart = performance.now();
    const orderPreserved = newRankings.every((pokemon, index) => updatedRankings[index].id === pokemon.id);
    const perfOrderVerifyEnd = performance.now();
    console.log(`🎯 [PERF_MANUAL_ORDER_VERIFY] Order verification: ${(perfOrderVerifyEnd - perfOrderVerifyStart).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Order preserved correctly:', orderPreserved);
    
    if (!orderPreserved) {
      console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ ORDER WAS NOT PRESERVED! This is the bug!');
      console.error('🔥 [ENHANCED_MANUAL_REORDER] Expected order:', newRankings.map(p => p.id));
      console.error('🔥 [ENHANCED_MANUAL_REORDER] Actual order:', updatedRankings.map(p => p.id));
    } else {
      console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Order correctly preserved');
    }
    
    // Update state
    const perfStateUpdateStart = performance.now();
    setLocalRankings(updatedRankings);
    onRankingsUpdateRef.current(updatedRankings);
    const perfStateUpdateEnd = performance.now();
    console.log(`🎯 [PERF_MANUAL_STATE_UPDATE] State update: ${(perfStateUpdateEnd - perfStateUpdateStart).toFixed(2)}ms`);
    
    const perfManualReorderEnd = performance.now();
    console.log(`🎯 [PERF_MANUAL_REORDER_END] Total manual reorder: ${(perfManualReorderEnd - perfManualReorderStart).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder complete');
  }, [localRankings, validateRankingsIntegrity, simulateBattlesForReorder, updateScoresPreservingOrder, preventAutoResorting]);

  // PERFORMANCE FIX: Memoize display rankings to prevent recreation
  const displayRankings = useMemo(() => {
    const perfMemoStart = performance.now();
    console.log('🎯 [PERF_MEMO_START] Display rankings memoization started');
    
    const result = localRankings.map((pokemon) => ({
      ...pokemon,
      isBeingDragged: draggedPokemonId === pokemon.id
    }));
    
    const perfMemoEnd = performance.now();
    console.log(`🎯 [PERF_MEMO_END] Display rankings memoization: ${(perfMemoEnd - perfMemoStart).toFixed(2)}ms`);
    
    return result;
  }, [localRankings, draggedPokemonId]);

  const perfHookEnd = performance.now();
  console.log(`🎯 [PERF_HOOK_END] Total hook execution: ${(perfHookEnd - perfStart).toFixed(2)}ms`);

  return {
    displayRankings,
    handleDragStart,
    handleDragEnd,
    handleEnhancedManualReorder,
    isDragging,
    isUpdating
  };
};
