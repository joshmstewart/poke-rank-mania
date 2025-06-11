
import { useMemo, useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { createBattleStarter } from "./createBattleStarter";
import { useFormFilters } from "@/hooks/useFormFilters";
import { useCloudPendingBattles } from "./useCloudPendingBattles";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionUsed?: (suggestion: any) => void,
  currentBattle?: Pokemon[],
  initialBattleStartedRef?: React.MutableRefObject<boolean>
) => {
  // Get from Zustand store instead of React Context
  const { 
    initiatePendingBattle,
    queueBattlesForReorder,
    getNextRefinementBattle,
    popRefinementBattle,
    hasRefinementBattles,
    getRefinementBattleCount
  } = useTrueSkillStore();
  
  // Get form filters to ensure battle generation respects them
  const { shouldIncludePokemon, analyzeFilteringPipeline } = useFormFilters();
  
  // Get cloud pending battles
  const { getAllPendingIds, removePendingPokemon } = useCloudPendingBattles();
  
  // CRITICAL FIX: Filter Pokemon but ALWAYS include pending Pokemon
  const filteredPokemon = useMemo(() => {
    console.log(`🔍 [DEBUG_INTEGRATION] ===== STARTING POKEMON FILTERING =====`);
    console.log(`🔍 [DEBUG_INTEGRATION] Input Pokemon count: ${allPokemon.length}`);
    
    // Get pending Pokemon IDs first
    const pendingIds = getAllPendingIds();
    console.log(`🔍 [DEBUG_INTEGRATION] Pending Pokemon IDs: ${pendingIds}`);
    console.log(`🔍 [DEBUG_INTEGRATION] Pending IDs type: ${typeof pendingIds}`);
    console.log(`🔍 [DEBUG_INTEGRATION] Pending IDs isArray: ${Array.isArray(pendingIds)}`);
    console.log(`🔍 [DEBUG_INTEGRATION] Pending IDs length: ${pendingIds?.length || 'undefined'}`);
    
    if (allPokemon.length > 0) {
      const inputIds = allPokemon.map(p => p.id);
      const inputMinId = Math.min(...inputIds);
      const inputMaxId = Math.max(...inputIds);
      console.log(`🔍 [DEBUG_INTEGRATION] Input ID range: ${inputMinId} - ${inputMaxId}`);
      
      // Check if pending Pokemon exist in input
      const pendingInInput = allPokemon.filter(p => pendingIds.includes(p.id));
      console.log(`🔍 [DEBUG_INTEGRATION] Pending Pokemon found in input: ${pendingInInput.map(p => `${p.name}(${p.id})`).join(', ')}`);
    }

    // Apply form filters and use the analysis function
    const normalFiltered = analyzeFilteringPipeline(allPokemon);
    
    console.log(`🔍 [DEBUG_INTEGRATION] After normal form filtering: ${normalFiltered.length} Pokemon`);
    
    // CRITICAL FIX: Always ensure pending Pokemon are included, even if filtered out
    const pendingPokemon = allPokemon.filter(p => pendingIds.includes(p.id));
    console.log(`🔍 [DEBUG_INTEGRATION] Pending Pokemon from input: ${pendingPokemon.map(p => `${p.name}(${p.id})`).join(', ')}`);
    
    // Combine filtered Pokemon with pending Pokemon (remove duplicates)
    const normalFilteredIds = new Set(normalFiltered.map(p => p.id));
    const additionalPending = pendingPokemon.filter(p => !normalFilteredIds.has(p.id));
    
    console.log(`🔍 [DEBUG_INTEGRATION] Additional pending Pokemon to add: ${additionalPending.map(p => `${p.name}(${p.id})`).join(', ')}`);
    
    const finalFiltered = [...normalFiltered, ...additionalPending];
    
    console.log(`🔍 [DEBUG_INTEGRATION] Final filtered count: ${finalFiltered.length} Pokemon`);
    console.log(`🔍 [DEBUG_INTEGRATION] ===== FILTERING COMPLETE =====`);
    
    return finalFiltered;
  }, [allPokemon, shouldIncludePokemon, analyzeFilteringPipeline, getAllPendingIds]);

  const battleStarter = useMemo(() => {
    if (!filteredPokemon || filteredPokemon.length === 0) {
      console.log(`🔍 [DEBUG_INTEGRATION] No filtered Pokemon available for battleStarter`);
      return null;
    }
    
    console.log(`🔍 [DEBUG_INTEGRATION] Creating battleStarter with ${filteredPokemon.length} filtered Pokemon`);
    return createBattleStarter(filteredPokemon, currentRankings);
  }, [filteredPokemon, currentRankings]);

  // Create a refinement queue object for compatibility with existing code
  const refinementQueue = useMemo(() => ({
    hasRefinementBattles: hasRefinementBattles(),
    refinementBattleCount: getRefinementBattleCount(),
    getNextRefinementBattle,
    popRefinementBattle,
    queueBattlesForReorder
  }), [hasRefinementBattles, getRefinementBattleCount, getNextRefinementBattle, popRefinementBattle, queueBattlesForReorder]);

  // CRITICAL FIX: Fix the startNewBattle function to actually prioritize pending Pokemon
  const startNewBattle = useCallback((battleType: any) => {
    // ===============================================================
    // FINAL FIX: This guard makes it impossible for a second initial
    // battle to be created, no matter what calls this function.
    if (initialBattleStartedRef?.current) {
      console.error(`❌ [startNewBattle] Blocked duplicate call.`);
      return []; // ABORT
    }
    // ===============================================================

    // ===============================================================
    // CRITICAL FIX: COMPLETELY BLOCK INITIAL BATTLE LOGIC WHEN 
    // PENDING BATTLE IS FLAGGED - THIS PREVENTS THE RACE CONDITION
    // ===============================================================
    if (initiatePendingBattle) {
      console.log(`🏁 [INITIAL_BATTLE_DEBUG] Deferring to Master Battle Starter for pending battle.`);
      return []; // Exit completely, let MASTER_BATTLE_START handle it
    }

    const callId = `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== startNewBattle CALLED =====`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Battle type: ${battleType}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Filtered Pokemon available: ${filteredPokemon.length}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] BattleStarter exists: ${!!battleStarter}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Timestamp: ${new Date().toISOString()}`);
    
    if (!battleStarter) {
      console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] ❌ NO BATTLE STARTER - returning empty array`);
      return [];
    }
    
    // CRITICAL FIX: ALWAYS check for cloud pending battles FIRST and prioritize them
    const cloudPendingIds = getAllPendingIds();
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== MANDATORY CLOUD PENDING BATTLES CHECK =====`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Cloud pending IDs: ${cloudPendingIds}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Cloud pending count: ${cloudPendingIds?.length || 0}`);
    
    if (cloudPendingIds && Array.isArray(cloudPendingIds) && cloudPendingIds.length > 0) {
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] 🎯 FORCING PENDING POKEMON BATTLE!`);
      
      // Find pending Pokemon objects
      const pendingPokemon = allPokemon.filter(p => cloudPendingIds.includes(p.id));
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Found ${pendingPokemon.length} pending Pokemon objects`);
      
      if (pendingPokemon.length > 0) {
        // Use the first pending Pokemon as primary
        const primaryPokemon = pendingPokemon[0];
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] 🎯 FORCING PRIMARY: ${primaryPokemon.name}(${primaryPokemon.id})`);
        
        // Find an opponent from available Pokemon
        const availableOpponents = allPokemon.filter(p => p.id !== primaryPokemon.id);
        let opponent: Pokemon;
        
        if (availableOpponents.length > 0) {
          opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
          console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] 🎯 OPPONENT: ${opponent.name}(${opponent.id})`);
        } else {
          console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] ❌ No opponents available!`);
          return [];
        }
        
        const forcedBattle = [primaryPokemon, opponent];
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ✅ FORCED PENDING BATTLE: ${primaryPokemon.name} vs ${opponent.name}`);
        
        // Set the battle immediately
        setCurrentBattle(forcedBattle);
        setSelectedPokemon([]);
        
        // Remove the pending Pokemon after using it
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] 🗑️ REMOVING PENDING: ${primaryPokemon.id}`);
        removePendingPokemon(primaryPokemon.id);
        
        // Also remove opponent if it was pending
        if (cloudPendingIds.includes(opponent.id)) {
          console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] 🗑️ ALSO REMOVING PENDING OPPONENT: ${opponent.id}`);
          removePendingPokemon(opponent.id);
        }
        
        return forcedBattle;
      } else {
        console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] ❌ No pending Pokemon objects found!`);
      }
    } else {
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] No pending Pokemon - proceeding with normal battle`);
    }
    
    // Check refinement queue using Zustand store
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== CHECKING ZUSTAND REFINEMENT QUEUE =====`);
    if (hasRefinementBattles()) {
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== GENERATING REFINEMENT BATTLE =====`);
      
      const nextBattle = getNextRefinementBattle();
      if (nextBattle) {
        const pokemon1 = filteredPokemon.find(p => p.id === nextBattle.primaryPokemonId);
        const pokemon2 = filteredPokemon.find(p => p.id === nextBattle.opponentPokemonId);
        
        if (pokemon1 && pokemon2) {
          console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ✅ REFINEMENT BATTLE: ${pokemon1.name} vs ${pokemon2.name}`);
          const refinementResult = [pokemon1, pokemon2];
          
          setCurrentBattle(refinementResult);
          setSelectedPokemon([]);
          popRefinementBattle();
          
          return refinementResult;
        }
      }
    }
    
    // Fall back to normal battle generation
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== NORMAL BATTLE GENERATION =====`);
    const normalResult = battleStarter.startNewBattle(battleType, refinementQueue);
    
    if (normalResult && normalResult.length > 0) {
      setCurrentBattle(normalResult);
      setSelectedPokemon([]);
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ✅ Normal battle: ${normalResult.map(p => p.name).join(' vs ')}`);
    }
    
    return normalResult || [];
  }, [battleStarter, filteredPokemon, getAllPendingIds, removePendingPokemon, refinementQueue, setCurrentBattle, setSelectedPokemon, allPokemon, initialBattleStartedRef, initiatePendingBattle, hasRefinementBattles, getNextRefinementBattle, popRefinementBattle]);

  // Log whenever startNewBattle callback changes
  useEffect(() => {
    console.log(`🔍 [DEBUG_INTEGRATION] startNewBattle callback updated/created`);
    console.log(`🔍 [DEBUG_INTEGRATION] - Callback exists: ${!!startNewBattle}`);
    console.log(`🔍 [DEBUG_INTEGRATION] - Callback type: ${typeof startNewBattle}`);
  }, [startNewBattle]);

  const resetSuggestionPriority = useCallback(() => {
    console.log(`🔍 [DEBUG_INTEGRATION] resetSuggestionPriority called`);
    if (battleStarter) {
      battleStarter.resetSuggestionPriority();
    }
  }, [battleStarter]);

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue
  };
};
