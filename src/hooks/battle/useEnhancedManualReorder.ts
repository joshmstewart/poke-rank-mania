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
    console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] preventAutoResorting:', preventAutoResorting);
    
    // CRITICAL: Special logging for Darumaka (ID 554) drag scenario
    if (draggedPokemon.id === 554) {
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] ===== DARUMAKA BEING MOVED =====`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Current score: ${draggedPokemon.score}`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Current rating:`, draggedPokemon.rating);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Target index: ${newIndex}`);
    }
    
    // CRITICAL: Log Charmander's current state if this is Charmander
    if (draggedPokemon.id === 4) {
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] ===== CHARMANDER BEING MOVED =====`);
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] Current score: ${draggedPokemon.score}`);
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] Current rating:`, draggedPokemon.rating);
    }
    
    if (preventAutoResorting) {
      console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ RANKING MODE: Manual positioning without battles');
    } else {
      console.log('🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ⚔️ BATTLE MODE: May trigger implied battles');
    }
    
    // Constants - INCREASED GAPS for better stability
    const MIN_SIGMA = 1.0;
    const SCORE_GAP = 3.0; // Increased from 1.0 to 3.0 for better separation
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Using MIN_SIGMA: ${MIN_SIGMA}, SCORE_GAP: ${SCORE_GAP}`);
    
    // Get current rating for the dragged Pokemon
    const currentRating = getRating(draggedPokemon.id.toString());
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Current rating from store - μ=${currentRating.mu.toFixed(5)}, σ=${currentRating.sigma.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Current displayed score: ${(currentRating.mu - currentRating.sigma).toFixed(5)}`);
    
    // Create the final rankings array to determine correct neighbors
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
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Above Pokemon:`, abovePokemon ? `${abovePokemon.name} (ID: ${abovePokemon.id}) at final position ${newIndex - 1}` : 'None (top position)');
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target Pokemon: ${draggedPokemon.name} (ID: ${draggedPokemon.id}) at final position ${newIndex}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Below Pokemon:`, belowPokemon ? `${belowPokemon.name} (ID: ${belowPokemon.id}) at final position ${newIndex + 1}` : 'None (bottom position)');
    
    // CRITICAL: Special case for Darumaka between Voltorb-hisui and Cubchoo
    if (draggedPokemon.id === 554) {
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] ===== DARUMAKA NEIGHBOR ANALYSIS =====`);
      if (abovePokemon) {
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Above: ${abovePokemon.name} (ID: ${abovePokemon.id})`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Above score: ${abovePokemon.score}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Is Voltorb-hisui (10231)? ${abovePokemon.id === 10231}`);
      }
      if (belowPokemon) {
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Below: ${belowPokemon.name} (ID: ${belowPokemon.id})`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Below score: ${belowPokemon.score}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Is Cubchoo (613)? ${belowPokemon.id === 613}`);
      }
    }
    
    // CRITICAL: Get neighbor ratings and scores from TrueSkill store (most current)
    let aboveScore = 0, belowScore = 0;
    
    if (abovePokemon) {
      const aboveRating = getRating(abovePokemon.id.toString());
      aboveScore = aboveRating.mu - aboveRating.sigma;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Above ${abovePokemon.name}: TrueSkill μ=${aboveRating.mu.toFixed(5)}, σ=${aboveRating.sigma.toFixed(5)}, calculated score=${aboveScore.toFixed(5)}`);
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Above ${abovePokemon.name}: Display score from object=${abovePokemon.score.toFixed(5)}`);
      
      // CRITICAL: Special logging for Darumaka's above neighbor
      if (draggedPokemon.id === 554) {
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Above neighbor score calculation:`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] TrueSkill: μ=${aboveRating.mu.toFixed(5)}, σ=${aboveRating.sigma.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Calculated: ${aboveScore.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Expected ~23.67: ${Math.abs(aboveScore - 23.67) < 0.1 ? 'MATCH' : 'MISMATCH'}`);
      }
    }
    
    if (belowPokemon) {
      const belowRating = getRating(belowPokemon.id.toString());
      belowScore = belowRating.mu - belowRating.sigma;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Below ${belowPokemon.name}: TrueSkill μ=${belowRating.mu.toFixed(5)}, σ=${belowRating.sigma.toFixed(5)}, calculated score=${belowScore.toFixed(5)}`);
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Below ${belowPokemon.name}: Display score from object=${belowPokemon.score.toFixed(5)}`);
      
      // CRITICAL: Special logging for Darumaka's below neighbor
      if (draggedPokemon.id === 554) {
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Below neighbor score calculation:`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] TrueSkill: μ=${belowRating.mu.toFixed(5)}, σ=${belowRating.sigma.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Calculated: ${belowScore.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Expected ~22.12: ${Math.abs(belowScore - 22.12) < 0.1 ? 'MATCH' : 'MISMATCH'}`);
      }
    }
    
    // Calculate target score based on final position with LARGER GAPS
    let targetDisplayedScore: number;
    
    if (abovePokemon && belowPokemon) {
      // Between two Pokemon - check if gap adjustment is needed
      const currentGap = aboveScore - belowScore;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Current gap between neighbors: ${currentGap.toFixed(5)}`);
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Required gap threshold: ${SCORE_GAP * 2}`);
      
      // CRITICAL: Special case for Darumaka
      if (draggedPokemon.id === 554) {
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] ===== DARUMAKA TARGET CALCULATION =====`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Above score: ${aboveScore.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Below score: ${belowScore.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Gap: ${currentGap.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Expected average: ${((aboveScore + belowScore) / 2).toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Expected range: 22.1 - 23.6`);
      }
      
      if (currentGap < SCORE_GAP * 2) {
        // Not enough gap - adjust the scores of surrounding Pokemon first
        console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] INSUFFICIENT GAP: ${currentGap.toFixed(3)} < ${SCORE_GAP * 2}`);
        console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ⚠️ ADJUSTING NEIGHBOR SCORES ⚠️`);
        
        // CRITICAL: This is likely where Darumaka's score gets messed up!
        if (draggedPokemon.id === 554) {
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] ⚠️ NEIGHBOR ADJUSTMENT TRIGGERED ⚠️`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] This might be causing the bug!`);
        }
        
        // Get current neighbor ratings
        const aboveRating = getRating(abovePokemon.id.toString());
        const belowRating = getRating(belowPokemon.id.toString());
        
        // Push the above Pokemon higher and below Pokemon lower
        const newAboveMu = aboveScore + SCORE_GAP + MIN_SIGMA;
        const newBelowMu = belowScore - SCORE_GAP + MIN_SIGMA;
        
        console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Old above ${abovePokemon.name} μ: ${aboveRating.mu.toFixed(5)} -> New μ: ${newAboveMu.toFixed(5)}`);
        console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Old below ${belowPokemon.name} μ: ${belowRating.mu.toFixed(5)} -> New μ: ${newBelowMu.toFixed(5)}`);
        
        // CRITICAL: Log Darumaka's neighbor adjustments
        if (draggedPokemon.id === 554) {
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] ===== NEIGHBOR ADJUSTMENT DETAILS =====`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Above ${abovePokemon.name}: ${aboveRating.mu.toFixed(5)} -> ${newAboveMu.toFixed(5)}`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Below ${belowPokemon.name}: ${belowRating.mu.toFixed(5)} -> ${newBelowMu.toFixed(5)}`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] SCORE_GAP: ${SCORE_GAP}, MIN_SIGMA: ${MIN_SIGMA}`);
        }
        
        updateRating(abovePokemon.id.toString(), new Rating(newAboveMu, Math.max(aboveRating.sigma * 0.9, MIN_SIGMA)));
        updateRating(belowPokemon.id.toString(), new Rating(newBelowMu, Math.max(belowRating.sigma * 0.9, MIN_SIGMA)));
        
        console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ADJUSTED NEIGHBORS: Above +${SCORE_GAP}, Below -${SCORE_GAP}`);
        
        // Now set target exactly in the middle of the NEW scores
        const newAboveDisplayScore = newAboveMu - MIN_SIGMA;
        const newBelowDisplayScore = newBelowMu - MIN_SIGMA;
        targetDisplayedScore = (newAboveDisplayScore + newBelowDisplayScore) / 2;
        
        console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target based on adjusted neighbors: (${newAboveDisplayScore.toFixed(5)} + ${newBelowDisplayScore.toFixed(5)}) / 2 = ${targetDisplayedScore.toFixed(5)}`);
        
        // CRITICAL: Log Darumaka's final target after neighbor adjustment
        if (draggedPokemon.id === 554) {
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] ===== DARUMAKA TARGET AFTER ADJUSTMENT =====`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] New above score: ${newAboveDisplayScore.toFixed(5)}`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] New below score: ${newBelowDisplayScore.toFixed(5)}`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Calculated target: ${targetDisplayedScore.toFixed(5)}`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Should be ~22.9 but might be way off!`);
        }
      } else {
        // Sufficient gap exists - use simple average
        targetDisplayedScore = (aboveScore + belowScore) / 2;
        console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target based on existing gap: (${aboveScore.toFixed(5)} + ${belowScore.toFixed(5)}) / 2 = ${targetDisplayedScore.toFixed(5)}`);
        
        // CRITICAL: Log Darumaka's simple average calculation
        if (draggedPokemon.id === 554) {
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] ===== DARUMAKA SIMPLE AVERAGE =====`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Simple average: ${targetDisplayedScore.toFixed(5)}`);
          console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Expected ~22.9: ${Math.abs(targetDisplayedScore - 22.9) < 0.5 ? 'GOOD' : 'BAD'}`);
        }
      }
      
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] BETWEEN TWO: above=${aboveScore.toFixed(5)}, below=${belowScore.toFixed(5)}, target=${targetDisplayedScore.toFixed(5)}`);
    } else if (abovePokemon && !belowPokemon) {
      // Bottom position - well below the Pokemon above
      targetDisplayedScore = aboveScore - SCORE_GAP;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] BOTTOM POSITION: above=${aboveScore.toFixed(5)}, target=${targetDisplayedScore.toFixed(5)}`);
    } else if (!abovePokemon && belowPokemon) {
      // Top position - well above the Pokemon below
      targetDisplayedScore = belowScore + SCORE_GAP;
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] TOP POSITION: below=${belowScore.toFixed(5)}, target=${targetDisplayedScore.toFixed(5)}`);
    } else {
      // Single Pokemon in list
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] SINGLE POKEMON - no adjustment needed`);
      return;
    }
    
    // Calculate new mu and sigma with reduced sigma for more confidence
    const newSigma = Math.max(currentRating.sigma * 0.7, MIN_SIGMA); // More confident
    const newMu = targetDisplayedScore + newSigma;
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] CALCULATED VALUES:`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] Target displayed score: ${targetDisplayedScore.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] New μ: ${newMu.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] New σ: ${newSigma.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] VERIFICATION: new displayed score = ${(newMu - newSigma).toFixed(5)} (should equal target: ${targetDisplayedScore.toFixed(5)})`);
    
    // CRITICAL: Log before updating if this is Charmander
    if (draggedPokemon.id === 4) {
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] ===== BEFORE TRUESKILL UPDATE =====`);
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] About to set μ=${newMu.toFixed(5)}, σ=${newSigma.toFixed(5)}`);
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] Expected final score: ${(newMu - newSigma).toFixed(5)}`);
    }
    
    // CRITICAL: Log before updating if this is Darumaka
    if (draggedPokemon.id === 554) {
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] ===== BEFORE TRUESKILL UPDATE =====`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] About to set μ=${newMu.toFixed(5)}, σ=${newSigma.toFixed(5)}`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Expected final score: ${(newMu - newSigma).toFixed(5)}`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Should be in range 22.1-23.6: ${(newMu - newSigma) >= 22.1 && (newMu - newSigma) <= 23.6 ? 'YES' : 'NO'}`);
    }
    
    // Update the rating in the store
    const newRating = new Rating(newMu, newSigma);
    updateRating(draggedPokemon.id.toString(), newRating);
    
    // CRITICAL: Verify the update immediately
    const verifyRating = getRating(draggedPokemon.id.toString());
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ Rating updated in TrueSkill store`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ Verification: stored μ=${verifyRating.mu.toFixed(5)}, σ=${verifyRating.sigma.toFixed(5)}`);
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ Verification: calculated score=${(verifyRating.mu - verifyRating.sigma).toFixed(5)}`);
    
    // CRITICAL: Log after updating if this is Charmander
    if (draggedPokemon.id === 4) {
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] ===== AFTER TRUESKILL UPDATE =====`);
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] Stored μ=${verifyRating.mu.toFixed(5)}, σ=${verifyRating.sigma.toFixed(5)}`);
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] Calculated score: ${(verifyRating.mu - verifyRating.sigma).toFixed(5)}`);
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] Target was: ${targetDisplayedScore.toFixed(5)}`);
      console.log(`🔥🔥🔥 [CHARMANDER_TRACE_${operationId}] Match? ${Math.abs((verifyRating.mu - verifyRating.sigma) - targetDisplayedScore) < 0.001 ? 'YES' : 'NO'}`);
    }
    
    // CRITICAL: Log after updating if this is Darumaka
    if (draggedPokemon.id === 554) {
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] ===== AFTER TRUESKILL UPDATE =====`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Stored μ=${verifyRating.mu.toFixed(5)}, σ=${verifyRating.sigma.toFixed(5)}`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Calculated score: ${(verifyRating.mu - verifyRating.sigma).toFixed(5)}`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Target was: ${targetDisplayedScore.toFixed(5)}`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] Match? ${Math.abs((verifyRating.mu - verifyRating.sigma) - targetDisplayedScore) < 0.001 ? 'YES' : 'NO'}`);
      console.log(`🎯🎯🎯 [DARUMAKA_BUG_TRACE_${operationId}] In expected range? ${(verifyRating.mu - verifyRating.sigma) >= 22.1 && (verifyRating.mu - verifyRating.sigma) <= 23.6 ? 'YES' : 'NO'}`);
    }
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ Pokemon ${draggedPokemon.name} should now stay at position ${newIndex} with increased score gap`);
    
    // CRITICAL FIX: In ranking mode, we do NOT call addImpliedBattle
    if (!preventAutoResorting && addImpliedBattle && abovePokemon) {
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ⚔️ BATTLE MODE: Adding implied battle vs ${abovePokemon.name}`);
      addImpliedBattle(draggedPokemon.id, abovePokemon.id);
    } else if (preventAutoResorting) {
      console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ✅ RANKING MODE: Skipping implied battles to maintain manual position`);
    }
    
    console.log(`🔥🔥🔥 [MANUAL_SCORE_ADJUSTMENT] ===== MANUAL SCORE ADJUSTMENT COMPLETE (${operationId}) =====`);
  }, [getRating, updateRating, preventAutoResorting, addImpliedBattle]);

  const recalculateScores = useCallback((rankings: RankedPokemon[]): RankedPokemon[] => {
    console.log('🔥 [ENHANCED_REORDER_RECALC] ===== RECALCULATING SCORES =====');
    console.log('🔥 [ENHANCED_REORDER_RECALC] Recalculating scores for', rankings.length, 'Pokemon');
    
    const recalculated = rankings.map((pokemon, index) => {
      const rating = getRating(pokemon.id.toString());
      const conservativeEstimate = rating.mu - rating.sigma;
      const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));
      
      // CRITICAL: Log Charmander's recalculation
      if (pokemon.id === 4) {
        console.log(`🔥 [CHARMANDER_RECALC] ===== CHARMANDER RECALCULATION =====`);
        console.log(`🔥 [CHARMANDER_RECALC] Position in array: ${index}`);
        console.log(`🔥 [CHARMANDER_RECALC] From TrueSkill store: μ=${rating.mu.toFixed(5)}, σ=${rating.sigma.toFixed(5)}`);
        console.log(`🔥 [CHARMANDER_RECALC] Calculated score: ${conservativeEstimate.toFixed(5)}`);
        console.log(`🔥 [CHARMANDER_RECALC] Previous score: ${pokemon.score.toFixed(5)}`);
        console.log(`🔥 [CHARMANDER_RECALC] Score changed: ${Math.abs(conservativeEstimate - pokemon.score) > 0.001 ? 'YES' : 'NO'}`);
      }
      
      // CRITICAL: Log Darumaka's recalculation
      if (pokemon.id === 554) {
        console.log(`🎯🎯🎯 [DARUMAKA_RECALC] ===== DARUMAKA RECALCULATION =====`);
        console.log(`🎯🎯🎯 [DARUMAKA_RECALC] Position in array: ${index}`);
        console.log(`🎯🎯🎯 [DARUMAKA_RECALC] From TrueSkill store: μ=${rating.mu.toFixed(5)}, σ=${rating.sigma.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_RECALC] Calculated score: ${conservativeEstimate.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_RECALC] Previous score: ${pokemon.score.toFixed(5)}`);
        console.log(`🎯🎯🎯 [DARUMAKA_RECALC] Score changed: ${Math.abs(conservativeEstimate - pokemon.score) > 0.001 ? 'YES' : 'NO'}`);
        console.log(`🎯🎯🎯 [DARUMAKA_RECALC] In expected range 22.1-23.6? ${conservativeEstimate >= 22.1 && conservativeEstimate <= 23.6 ? 'YES' : 'NO'}`);
      }
      
      return {
        ...pokemon,
        score: conservativeEstimate,
        confidence: confidence,
        rating: rating,
        count: pokemon.count || 0
      };
    });
    
    console.log('🔥 [ENHANCED_REORDER_RECALC] ===== RECALCULATION COMPLETE =====');
    return recalculated;
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
