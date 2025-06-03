import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from '@/services/pokemon';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { Rating } from 'ts-trueskill';
import { useRenderTracker } from './useRenderTracker';

// CRITICAL: Persistent logging utility that survives DevTools crashes
const persistentLog = {
  logs: [] as string[],
  
  add: (message: string) => {
    const timestamp = Date.now();
    const logEntry = `[${timestamp}] ${message}`;
    persistentLog.logs.push(logEntry);
    
    // Save to localStorage immediately
    try {
      localStorage.setItem('debugPerfLogs', JSON.stringify(persistentLog.logs));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    
    // Also log to console for immediate viewing
    console.log(`🔍 [PERSISTENT_LOG] ${logEntry}`);
  },
  
  clear: () => {
    persistentLog.logs = [];
    localStorage.removeItem('debugPerfLogs');
  },
  
  retrieve: () => {
    try {
      const stored = localStorage.getItem('debugPerfLogs');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
};

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (newRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean,
  addImpliedBattle?: (winnerId: number, loserId: number) => void
) => {
  const perfStart = performance.now();
  persistentLog.add(`🎯 HOOK_START: useEnhancedManualReorder execution started with ${finalRankings.length} rankings`);

  // CRITICAL: Early bailout for extremely large datasets
  if (finalRankings.length > 500) {
    persistentLog.add(`❌ BAILOUT: Dataset too large (${finalRankings.length} items). Bailing out to prevent crash.`);
    console.error('Dataset too large for manual reorder. Please reduce the number of items.');
    return {
      displayRankings: finalRankings,
      handleDragStart: () => {},
      handleDragEnd: () => {},
      handleEnhancedManualReorder: () => {},
      isDragging: false,
      isUpdating: false
    };
  }

  // Track renders for performance debugging
  useRenderTracker('useEnhancedManualReorder', { 
    rankingsCount: finalRankings.length,
    preventAutoResorting 
  });

  const perfAfterRenderTracker = performance.now();
  persistentLog.add(`🎯 RENDER_TRACKER: Time: ${(perfAfterRenderTracker - perfStart).toFixed(2)}ms`);

  const { updateRating, getRating } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();

  const perfAfterStoreAccess = performance.now();
  persistentLog.add(`🎯 STORE_ACCESS: Time: ${(perfAfterStoreAccess - perfAfterRenderTracker).toFixed(2)}ms`);
  
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] ===== HOOK INITIALIZATION =====');
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] finalRankings length:', finalRankings.length);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] onRankingsUpdate exists:', !!onRankingsUpdate);
  console.log('🔥 [ENHANCED_REORDER_HOOK_INIT] preventAutoResorting:', preventAutoResorting);

  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>(finalRankings);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPokemonId, setDraggedPokemonId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // CRITICAL FIX: Use refs to always have access to current state
  const localRankingsRef = useRef<RankedPokemon[]>(localRankings);
  const finalRankingsRef = useRef<RankedPokemon[]>(finalRankings);
  
  // Update refs whenever state changes
  useEffect(() => {
    localRankingsRef.current = localRankings;
    persistentLog.add(`🔍 STATE_REF_UPDATE: localRankingsRef updated to ${localRankings.length} items`);
  }, [localRankings]);
  
  useEffect(() => {
    finalRankingsRef.current = finalRankings;
    persistentLog.add(`🔍 STATE_REF_UPDATE: finalRankingsRef updated to ${finalRankings.length} items`);
  }, [finalRankings]);

  const perfAfterStateInit = performance.now();
  persistentLog.add(`🎯 STATE_INIT: Time: ${(perfAfterStateInit - perfAfterStoreAccess).toFixed(2)}ms`);

  // CRITICAL: Log data sync issues
  persistentLog.add(`🔍 DATA_SYNC: finalRankings=${finalRankings.length}, localRankings=${localRankings.length}`);
  if (finalRankings.length !== localRankings.length) {
    persistentLog.add(`⚠️ DATA_SYNC_MISMATCH: finalRankings (${finalRankings.length}) != localRankings (${localRankings.length})`);
  }

  // Stable refs to prevent recreation
  const onRankingsUpdateRef = useRef(onRankingsUpdate);
  onRankingsUpdateRef.current = onRankingsUpdate;

  // Update local rankings when final rankings change (but not during drag)
  useEffect(() => {
    const perfEffectStart = performance.now();
    persistentLog.add(`🎯 EFFECT_START: Local rankings update effect triggered`);
    persistentLog.add(`🔍 EFFECT_DATA: finalRankings=${finalRankings.length}, isDragging=${isDragging}, isUpdating=${isUpdating}`);
    
    if (!isDragging && !isUpdating) {
      persistentLog.add(`🔍 EFFECT_UPDATE: Updating localRankings from ${localRankings.length} to ${finalRankings.length} items`);
      setLocalRankings(finalRankings);
    } else {
      persistentLog.add(`🔍 EFFECT_SKIP: Skipping update (isDragging=${isDragging}, isUpdating=${isUpdating})`);
    }
    
    const perfEffectEnd = performance.now();
    persistentLog.add(`🎯 EFFECT_END: Effect time: ${(perfEffectEnd - perfEffectStart).toFixed(2)}ms`);
  }, [finalRankings, isDragging, isUpdating]);

  // CRITICAL FIX: Helper function to get current rankings with fallback
  const getCurrentRankings = useCallback((): RankedPokemon[] => {
    const current = localRankingsRef.current;
    const fallback = finalRankingsRef.current;
    
    persistentLog.add(`🔍 GET_CURRENT: current=${current.length}, fallback=${fallback.length}`);
    
    if (current.length === 0 && fallback.length > 0) {
      persistentLog.add(`⚠️ USING_FALLBACK: localRankings is empty, using finalRankings as fallback`);
      return fallback;
    }
    
    return current;
  }, []);

  // validateRankingsIntegrity function
  const validateRankingsIntegrity = useCallback((rankings: RankedPokemon[]): boolean => {
    const perfValidationStart = performance.now();
    persistentLog.add(`🎯 VALIDATION_START: Rankings integrity validation started for ${rankings.length} items`);
    
    const uniqueIds = new Set(rankings.map(p => p.id));
    if (uniqueIds.size !== rankings.length) {
      persistentLog.add(`❌ VALIDATION_FAILED: Duplicate Pokemon IDs found in rankings!`);
      console.error('🔥 [ENHANCED_REORDER_VALIDATION] Duplicate Pokemon IDs found in rankings!');
      return false;
    }
    
    const hasValidStructure = rankings.every(p => 
      typeof p.id === 'number' && 
      typeof p.name === 'string' && 
      typeof p.score === 'number'
    );
    
    if (!hasValidStructure) {
      persistentLog.add(`❌ VALIDATION_FAILED: Invalid Pokemon structure found!`);
      console.error('🔥 [ENHANCED_REORDER_VALIDATION] Invalid Pokemon structure found!');
      return false;
    }
    
    const perfValidationEnd = performance.now();
    persistentLog.add(`🎯 VALIDATION_END: Validation time: ${(perfValidationEnd - perfValidationStart).toFixed(2)}ms`);
    
    return true;
  }, []);

  // simulateBattlesForReorder function
  const simulateBattlesForReorder = useCallback((
    reorderedRankings: RankedPokemon[],
    movedPokemon: RankedPokemon,
    oldIndex: number,
    newIndex: number
  ) => {
    const perfBattleSimStart = performance.now();
    persistentLog.add(`🎯 BATTLE_SIM_START: Battle simulation started for ${movedPokemon.name} (${oldIndex} -> ${newIndex})`);
    
    let battlesSimulated = 0;
    const maxBattles = Math.min(10, Math.abs(newIndex - oldIndex)); // Limit battles to prevent crashes
    
    persistentLog.add(`🎯 BATTLE_SIM_LIMIT: Will simulate max ${maxBattles} battles`);
    
    if (newIndex < oldIndex) {
      const perfUpwardMoveStart = performance.now();
      persistentLog.add(`🎯 UPWARD_MOVE_START: Processing upward move battles`);
      
      // Pokemon moved up - it should beat Pokemon it moved past
      console.log('🔥🔥🔥 [BATTLE_SIMULATION] Pokemon moved UP - simulating wins');
      const endIndex = Math.min(oldIndex, newIndex + maxBattles);
      
      for (let i = newIndex; i < endIndex && battlesSimulated < maxBattles; i++) {
        const perfBattleStart = performance.now();
        const opponent = reorderedRankings[i + 1];
        if (opponent && opponent.id !== movedPokemon.id) {
          // Get current ratings
          const winnerRating = getRating(movedPokemon.id.toString());
          const loserRating = getRating(opponent.id.toString());
          
          // Calculate new ratings - simplified to avoid crashes
          const ratingChange = 1.0; // Fixed small change
          
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
        const perfBattleEnd = performance.now();
        persistentLog.add(`🎯 SINGLE_BATTLE_${i}: Battle processing time: ${(perfBattleEnd - perfBattleStart).toFixed(2)}ms`);
      }
      
      const perfUpwardMoveEnd = performance.now();
      persistentLog.add(`🎯 UPWARD_MOVE_END: Upward move processing: ${(perfUpwardMoveEnd - perfUpwardMoveStart).toFixed(2)}ms`);
    } else if (newIndex > oldIndex) {
      const perfDownwardMoveStart = performance.now();
      persistentLog.add(`🎯 DOWNWARD_MOVE_START: Processing downward move battles`);
      
      // Pokemon moved down - Pokemon it moved past should beat it
      console.log('🔥🔥🔥 [BATTLE_SIMULATION] Pokemon moved DOWN - simulating losses');
      const endIndex = Math.min(newIndex + 1, oldIndex + 1 + maxBattles);
      
      for (let i = oldIndex + 1; i <= newIndex && i < endIndex && battlesSimulated < maxBattles; i++) {
        const perfBattleStart = performance.now();
        const opponent = reorderedRankings[i - 1];
        if (opponent && opponent.id !== movedPokemon.id) {
          // Get current ratings
          const winnerRating = getRating(opponent.id.toString());
          const loserRating = getRating(movedPokemon.id.toString());
          
          // Calculate new ratings - simplified
          const ratingChange = 1.0; // Fixed small change
          
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
        const perfBattleEnd = performance.now();
        persistentLog.add(`🎯 SINGLE_BATTLE_${i}: Battle processing time: ${(perfBattleEnd - perfBattleStart).toFixed(2)}ms`);
      }
      
      const perfDownwardMoveEnd = performance.now();
      persistentLog.add(`🎯 DOWNWARD_MOVE_END: Downward move processing: ${(perfDownwardMoveEnd - perfDownwardMoveStart).toFixed(2)}ms`);
    }
    
    const perfBattleSimEnd = performance.now();
    persistentLog.add(`🎯 BATTLE_SIM_END: Total battle simulation: ${(perfBattleSimEnd - perfBattleSimStart).toFixed(2)}ms, battles: ${battlesSimulated}`);
    console.log('🔥🔥🔥 [BATTLE_SIMULATION] ✅ Simulated', battlesSimulated, 'battles');
    return battlesSimulated;
  }, [getRating, updateRating, addImpliedBattle, preventAutoResorting]);

  // updateScoresPreservingOrder function - OPTIMIZED VERSION
  const updateScoresPreservingOrder = useCallback((
    rankings: RankedPokemon[], 
    movedPokemonId?: number, 
    newPosition?: number
  ): RankedPokemon[] => {
    const perfScoreUpdateStart = performance.now();
    persistentLog.add(`🎯 SCORE_UPDATE_START: Optimized score update started for ${rankings.length} items`);
    console.log('🔥 [PRESERVE_ORDER_OPTIMIZED] ===== OPTIMIZED SCORE UPDATE =====');
    console.log('🔥 [PRESERVE_ORDER_OPTIMIZED] preventAutoResorting:', preventAutoResorting);
    console.log('🔥 [PRESERVE_ORDER_OPTIMIZED] movedPokemonId:', movedPokemonId);
    console.log('🔥 [PRESERVE_ORDER_OPTIMIZED] newPosition:', newPosition);

    // Determine which Pokemon need score updates
    let pokemonToUpdate: Set<number>;
    
    if (movedPokemonId !== undefined && newPosition !== undefined) {
      // OPTIMIZED: Only update the moved Pokemon and its neighbors
      pokemonToUpdate = new Set();
      
      // Add the moved Pokemon
      pokemonToUpdate.add(movedPokemonId);
      
      // Add neighbors: 5 above and 5 below the ending position
      const startNeighbor = Math.max(0, newPosition - 5);
      const endNeighbor = Math.min(rankings.length - 1, newPosition + 5);
      
      for (let i = startNeighbor; i <= endNeighbor; i++) {
        if (rankings[i]) {
          pokemonToUpdate.add(rankings[i].id);
        }
      }
      
      persistentLog.add(`🎯 OPTIMIZED_UPDATE: Will update ${pokemonToUpdate.size} Pokemon (moved + neighbors ${startNeighbor}-${endNeighbor})`);
      console.log('🔥 [PRESERVE_ORDER_OPTIMIZED] Updating Pokemon IDs:', Array.from(pokemonToUpdate));
    } else {
      // Fallback: Update all Pokemon (for non-drag operations)
      pokemonToUpdate = new Set(rankings.map(p => p.id));
      persistentLog.add(`🎯 FALLBACK_UPDATE: Will update all ${pokemonToUpdate.size} Pokemon (no move info)`);
    }
    
    // OPTIMIZED: Batch process only affected ratings
    const perfMapStart = performance.now();
    const updatedRankings = rankings.map((pokemon, index) => {
      const needsUpdate = pokemonToUpdate.has(pokemon.id);
      
      if (needsUpdate) {
        const perfSingleStart = performance.now();
        const rating = getRating(pokemon.id.toString());
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
        
        if (pokemonToUpdate.size <= 20) { // Only log details for small updates
          persistentLog.add(`🎯 UPDATED_${index}: ${pokemon.name} score ${pokemon.score.toFixed(2)} → ${conservativeEstimate.toFixed(2)}`);
        }
        
        console.log(`🔥 [PRESERVE_ORDER_OPTIMIZED] UPDATED ${index+1}. ${pokemon.name}: score ${pokemon.score.toFixed(2)} → ${conservativeEstimate.toFixed(2)}`);
        
        return {
          ...pokemon,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          mu: rating.mu,
          sigma: rating.sigma,
          count: pokemon.count || 0
        };
      } else {
        // Keep existing score data for unchanged Pokemon
        return pokemon;
      }
    });
    const perfMapEnd = performance.now();
    persistentLog.add(`🎯 OPTIMIZED_MAP: Map operation: ${(perfMapEnd - perfMapStart).toFixed(2)}ms for ${pokemonToUpdate.size}/${rankings.length} items`);
    
    console.log('🔥 [PRESERVE_ORDER_OPTIMIZED] FINAL Output order (MUST MATCH INPUT):', updatedRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    console.log('🔥 [PRESERVE_ORDER_OPTIMIZED] ===== OPTIMIZED ORDER PRESERVATION COMPLETE =====');
    
    // ABSOLUTELY NO SORTING when preventAutoResorting is true
    const perfSortStart = performance.now();
    let finalResult;
    if (preventAutoResorting) {
      console.log('🔥 [PRESERVE_ORDER_OPTIMIZED] ✅ MANUAL ORDER PRESERVED - NO SORTING APPLIED');
      finalResult = updatedRankings;
    } else {
      console.log('🔥 [PRESERVE_ORDER_OPTIMIZED] ⚠️ Auto-resorting enabled - sorting by score');
      finalResult = updatedRankings.sort((a, b) => b.score - a.score);
    }
    const perfSortEnd = performance.now();
    persistentLog.add(`🎯 SORT: Sort operation: ${(perfSortEnd - perfSortStart).toFixed(2)}ms`);
    
    const perfScoreUpdateEnd = performance.now();
    persistentLog.add(`🎯 OPTIMIZED_SCORE_UPDATE_END: Total optimized score update: ${(perfScoreUpdateEnd - perfScoreUpdateStart).toFixed(2)}ms`);
    
    return finalResult;
  }, [getRating, preventAutoResorting]);

  const handleDragStart = useCallback((event: any) => {
    const perfDragStartBegin = performance.now();
    persistentLog.add(`🎯 DRAG_START_BEGIN: Drag start handler called`);
    
    const draggedId = parseInt(event.active.id);
    setIsDragging(true);
    setDraggedPokemonId(draggedId);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Drag started for Pokemon ID:', draggedId);
    
    const perfDragStartEnd = performance.now();
    persistentLog.add(`🎯 DRAG_START_END: Drag start handler: ${(perfDragStartEnd - perfDragStartBegin).toFixed(2)}ms`);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const perfDragEndBegin = performance.now();
    persistentLog.add(`🎯 DRAG_END_BEGIN: Drag end handler called - THIS IS WHERE THE SLOWNESS HAPPENS`);
    
    // CRITICAL FIX: Use current rankings from ref instead of stale state
    const currentRankings = getCurrentRankings();
    persistentLog.add(`🔍 DRAG_END_DATA: currentRankings.length=${currentRankings.length}, active.id=${event.active.id}, over.id=${event.over?.id || 'null'}`);
    
    const { active, over } = event;
    
    setIsDragging(false);
    setDraggedPokemonId(null);
    
    if (!over || active.id === over.id) {
      console.log('🔥 [ENHANCED_REORDER_DRAG] Drag ended with no change');
      const perfDragEndEarly = performance.now();
      persistentLog.add(`🎯 DRAG_END_EARLY: Early exit: ${(perfDragEndEarly - perfDragEndBegin).toFixed(2)}ms`);
      return;
    }

    console.log('🔥 [ENHANCED_REORDER_DRAG] ===== PROCESSING DRAG END =====');
    console.log('🔥 [ENHANCED_REORDER_DRAG] BEFORE DRAG - Current order:', currentRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    // CRITICAL: Log detailed data about the current state
    persistentLog.add(`🔍 DRAG_DETAILED: currentRankings has ${currentRankings.length} items`);
    if (currentRankings.length > 0) {
      persistentLog.add(`🔍 DRAG_FIRST_ITEMS: ${currentRankings.slice(0, 5).map(p => `${p.id}:${p.name}`).join(', ')}`);
    }
    
    const perfIndexFindStart = performance.now();
    const oldIndex = currentRankings.findIndex(p => p.id.toString() === active.id);
    const newIndex = currentRankings.findIndex(p => p.id.toString() === over.id);
    const perfIndexFindEnd = performance.now();
    persistentLog.add(`🎯 INDEX_FIND: Index finding: ${(perfIndexFindEnd - perfIndexFindStart).toFixed(2)}ms`);
    persistentLog.add(`🔍 INDEX_RESULTS: oldIndex=${oldIndex}, newIndex=${newIndex}, activeId=${active.id}, overId=${over.id}`);
    
    if (oldIndex === -1 || newIndex === -1) {
      persistentLog.add(`❌ INDEX_FIND_FAILED: Could not find Pokemon indices (old: ${oldIndex}, new: ${newIndex})`);
      persistentLog.add(`❌ SEARCH_DETAILS: Looking for activeId=${active.id} and overId=${over.id} in ${currentRankings.length} items`);
      if (currentRankings.length > 0) {
        persistentLog.add(`❌ SAMPLE_IDS: First 10 IDs in currentRankings: ${currentRankings.slice(0, 10).map(p => p.id).join(', ')}`);
      }
      console.error('🔥 [ENHANCED_REORDER_DRAG] Could not find Pokemon indices');
      return;
    }
    
    const movedPokemon = currentRankings[oldIndex];
    console.log('🔥 [ENHANCED_REORDER_DRAG] Moving:', movedPokemon.name, 'from position', oldIndex + 1, 'to position', newIndex + 1);
    
    // Create new rankings with manual order - THIS IS THE USER'S INTENDED ORDER
    const perfArrayMoveStart = performance.now();
    const newRankings = arrayMove(currentRankings, oldIndex, newIndex);
    const perfArrayMoveEnd = performance.now();
    persistentLog.add(`🎯 ARRAY_MOVE: Array move: ${(perfArrayMoveEnd - perfArrayMoveStart).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_REORDER_DRAG] AFTER MANUAL MOVE - New order:', newRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    console.log('🔥 [ENHANCED_REORDER_DRAG] ===== STARTING BATTLE SIMULATION =====');
    
    // Simulate battles and update TrueSkill ratings
    const battlesSimulated = simulateBattlesForReorder(newRankings, movedPokemon, oldIndex, newIndex);
    persistentLog.add(`🎯 BATTLES_SIMULATED: ${battlesSimulated} battles completed`);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Battles simulated:', battlesSimulated);
    
    // CRITICAL: ALWAYS preserve manual order, just update scores - OPTIMIZED VERSION
    const updatedRankings = updateScoresPreservingOrder(newRankings, movedPokemon.id, newIndex);
    
    console.log('🔥 [ENHANCED_REORDER_DRAG] FINAL ORDER CHECK (MUST MATCH MANUAL ORDER):');
    console.log('🔥 [ENHANCED_REORDER_DRAG] Manual order was:', newRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    console.log('🔥 [ENHANCED_REORDER_DRAG] Final order is:', updatedRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    // Verify order preservation
    const perfOrderVerifyStart = performance.now();
    const orderPreserved = newRankings.every((pokemon, index) => updatedRankings[index].id === pokemon.id);
    const perfOrderVerifyEnd = performance.now();
    persistentLog.add(`🎯 ORDER_VERIFY: Order verification: ${(perfOrderVerifyEnd - perfOrderVerifyStart).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_REORDER_DRAG] Order preserved correctly:', orderPreserved);
    
    if (!orderPreserved) {
      persistentLog.add(`❌ ORDER_NOT_PRESERVED: This is the bug!`);
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
    persistentLog.add(`🎯 STATE_UPDATE: State update: ${(perfStateUpdateEnd - perfStateUpdateStart).toFixed(2)}ms`);
    
    const perfDragEndComplete = performance.now();
    persistentLog.add(`🎯 DRAG_END_COMPLETE: Total drag end processing: ${(perfDragEndComplete - perfDragEndBegin).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_REORDER_DRAG] ✅ Drag processing complete');
  }, [getCurrentRankings, validateRankingsIntegrity, simulateBattlesForReorder, updateScoresPreservingOrder, preventAutoResorting]);

  // handleEnhancedManualReorder function
  const handleEnhancedManualReorder = useCallback((
    draggedPokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const perfManualReorderStart = performance.now();
    persistentLog.add(`🎯 MANUAL_REORDER_START: Manual reorder called for Pokemon ${draggedPokemonId} (${sourceIndex} -> ${destinationIndex}) - THIS IS WHERE THE SLOWNESS HAPPENS`);
    
    // CRITICAL FIX: Use current rankings from ref instead of stale state
    const currentRankings = getCurrentRankings();
    persistentLog.add(`🔍 MANUAL_DATA: currentRankings.length=${currentRankings.length}, sourceIndex=${sourceIndex}, destinationIndex=${destinationIndex}`);
    
    console.log('🔥 [ENHANCED_MANUAL_REORDER] ===== MANUAL REORDER CALLED =====');
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Pokemon:', draggedPokemonId, 'from', sourceIndex, 'to', destinationIndex);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] preventAutoResorting:', preventAutoResorting);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] BEFORE REORDER - Current order:', currentRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    // CRITICAL: Detailed logging for the empty array issue
    if (currentRankings.length === 0) {
      persistentLog.add(`❌ CRITICAL_ERROR: currentRankings is EMPTY! This is the root cause.`);
      persistentLog.add(`🔍 DEBUG_STATE: finalRankings.length=${finalRankingsRef.current.length}, isDragging=${isDragging}, isUpdating=${isUpdating}`);
      console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ CRITICAL: currentRankings is empty!');
      console.error('🔥 [ENHANCED_MANUAL_REORDER] finalRankings.length:', finalRankingsRef.current.length);
      console.error('🔥 [ENHANCED_MANUAL_REORDER] isDragging:', isDragging);
      console.error('🔥 [ENHANCED_MANUAL_REORDER] isUpdating:', isUpdating);
      return;
    }
    
    if (sourceIndex < 0 || sourceIndex >= currentRankings.length) {
      persistentLog.add(`❌ INVALID_SOURCE_INDEX: sourceIndex ${sourceIndex} is out of bounds (0-${currentRankings.length - 1})`);
      console.error('🔥 [ENHANCED_MANUAL_REORDER] ❌ Invalid source index:', sourceIndex, 'for array of length:', currentRankings.length);
      return;
    }
    
    const movedPokemon = currentRankings[sourceIndex];
    if (!movedPokemon) {
      persistentLog.add(`❌ POKEMON_NOT_FOUND: Pokemon not found at source index ${sourceIndex}`);
      console.error('🔥 [ENHANCED_MANUAL_REORDER] Pokemon not found at source index');
      return;
    }
    
    // Create new rankings with manual order - THIS IS THE USER'S INTENDED ORDER
    const perfArrayMoveStart = performance.now();
    const newRankings = arrayMove(currentRankings, sourceIndex, destinationIndex);
    const perfArrayMoveEnd = performance.now();
    persistentLog.add(`🎯 MANUAL_ARRAY_MOVE: Array move: ${(perfArrayMoveEnd - perfArrayMoveStart).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] AFTER MANUAL MOVE - New order:', newRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    console.log('🔥 [ENHANCED_MANUAL_REORDER] ===== STARTING BATTLE SIMULATION =====');
    
    // Simulate battles and update TrueSkill ratings
    const battlesSimulated = simulateBattlesForReorder(newRankings, movedPokemon, sourceIndex, destinationIndex);
    persistentLog.add(`🎯 MANUAL_BATTLES_SIMULATED: ${battlesSimulated} battles completed`);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Battles simulated:', battlesSimulated);
    
    // CRITICAL: ALWAYS preserve manual order, just update scores - OPTIMIZED VERSION
    const updatedRankings = updateScoresPreservingOrder(newRankings, draggedPokemonId, destinationIndex);
    
    console.log('🔥 [ENHANCED_MANUAL_REORDER] FINAL ORDER CHECK (MUST MATCH MANUAL ORDER):');
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Manual order was:', newRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Final order is:', updatedRankings.map((p, i) => `${i+1}. ${p.name}`).slice(0, 10));
    
    // Verify order preservation
    const perfOrderVerifyStart = performance.now();
    const orderPreserved = newRankings.every((pokemon, index) => updatedRankings[index].id === pokemon.id);
    const perfOrderVerifyEnd = performance.now();
    persistentLog.add(`🎯 MANUAL_ORDER_VERIFY: Order verification: ${(perfOrderVerifyEnd - perfOrderVerifyStart).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] Order preserved correctly:', orderPreserved);
    
    if (!orderPreserved) {
      persistentLog.add(`❌ MANUAL_ORDER_NOT_PRESERVED: This is the bug!`);
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
    persistentLog.add(`🎯 MANUAL_STATE_UPDATE: State update: ${(perfStateUpdateEnd - perfStateUpdateStart).toFixed(2)}ms`);
    
    const perfManualReorderEnd = performance.now();
    persistentLog.add(`🎯 MANUAL_REORDER_END: Total manual reorder: ${(perfManualReorderEnd - perfManualReorderStart).toFixed(2)}ms`);
    console.log('🔥 [ENHANCED_MANUAL_REORDER] ✅ Manual reorder complete');
  }, [getCurrentRankings, validateRankingsIntegrity, simulateBattlesForReorder, updateScoresPreservingOrder, preventAutoResorting, isDragging, isUpdating]);

  // PERFORMANCE FIX: Memoize display rankings to prevent recreation
  const displayRankings = useMemo(() => {
    const perfMemoStart = performance.now();
    persistentLog.add(`🎯 MEMO_START: Display rankings memoization started for ${localRankings.length} items`);
    
    const result = localRankings.map((pokemon) => ({
      ...pokemon,
      isBeingDragged: draggedPokemonId === pokemon.id
    }));
    
    const perfMemoEnd = performance.now();
    persistentLog.add(`🎯 MEMO_END: Display rankings memoization: ${(perfMemoEnd - perfMemoStart).toFixed(2)}ms`);
    
    return result;
  }, [localRankings, draggedPokemonId]);

  const perfHookEnd = performance.now();
  persistentLog.add(`🎯 HOOK_END: Total hook execution: ${(perfHookEnd - perfStart).toFixed(2)}ms`);

  // Add debug utility to window for retrieving logs
  if (typeof window !== 'undefined') {
    (window as any).getPerfLogs = () => {
      const logs = persistentLog.retrieve();
      console.log('🔍 [RETRIEVED_LOGS] Persistent logs:');
      logs.forEach(log => console.log(log));
      return logs;
    };
  }

  return {
    displayRankings,
    handleDragStart,
    handleDragEnd,
    handleEnhancedManualReorder,
    isDragging,
    isUpdating
  };
};
