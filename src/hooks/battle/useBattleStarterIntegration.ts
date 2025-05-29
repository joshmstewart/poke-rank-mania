
import { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { createBattleStarter } from "./createBattleStarter";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useFormFilters } from "@/hooks/useFormFilters";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionUsed?: (suggestion: any) => void,
  currentBattle?: Pokemon[]
) => {
  // Get form filters to ensure battle generation respects them
  const { shouldIncludePokemon } = useFormFilters();
  
  // Filter Pokemon based on form filters before creating battle starter
  const filteredPokemon = useMemo(() => {
    console.log(`🔍 [FILTER_DEBUG] Starting Pokemon filtering - Total: ${allPokemon.length}`);
    
    const filtered = allPokemon.filter(pokemon => {
      const shouldInclude = shouldIncludePokemon(pokemon);
      if (!shouldInclude) {
        console.log(`🚫 [FILTER_DEBUG] EXCLUDED: ${pokemon.name} (${pokemon.id}) - Form filter rejection`);
      }
      return shouldInclude;
    });
    
    console.log(`✅ [FILTER_DEBUG] Filtering complete - Included: ${filtered.length}, Excluded: ${allPokemon.length - filtered.length}`);
    return filtered;
  }, [allPokemon, shouldIncludePokemon]);

  const battleStarter = useMemo(() => {
    if (!filteredPokemon || filteredPokemon.length === 0) return null;
    
    console.log(`🎯 [FORM_FILTER_FIX] Creating battleStarter with ${filteredPokemon.length} filtered Pokemon (from ${allPokemon.length} total)`);
    return createBattleStarter(filteredPokemon, currentRankings);
  }, [filteredPokemon, currentRankings]);

  // Use shared refinement queue instead of creating a new instance
  const refinementQueue = useSharedRefinementQueue();

  const startNewBattle = (battleType: any) => {
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ===== startNewBattle CALLED =====`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Battle type: ${battleType}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Timestamp: ${new Date().toISOString()}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Call stack:`, new Error().stack?.split('\n').slice(1, 5));
    
    // TRACE: Check all prerequisites
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Prerequisites check:`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - battleStarter exists: ${!!battleStarter}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue exists: ${!!refinementQueue}`);
    
    if (refinementQueue) {
      // CRITICAL DEBUG: Log the EXACT refinement queue state
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] REFINEMENT QUEUE DEEP INSPECTION:`);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue object keys:`, Object.keys(refinementQueue));
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue.queue:`, refinementQueue.queue);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue.refinementQueue:`, refinementQueue.refinementQueue);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - typeof refinementQueue.getNextRefinementBattle:`, typeof refinementQueue.getNextRefinementBattle);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue.hasRefinementBattles:`, refinementQueue.hasRefinementBattles);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue.refinementBattleCount:`, refinementQueue.refinementBattleCount);
      
      // CRITICAL FIX: Use the actual queue arrays directly instead of computed properties
      const actualQueue = refinementQueue.queue || refinementQueue.refinementQueue || [];
      const actualCount = actualQueue.length;
      
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - actual queue array: ${JSON.stringify(actualQueue)}`);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - actual queue length: ${actualCount}`);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - hasRefinementBattles (computed): ${refinementQueue.hasRefinementBattles}`);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementBattleCount (computed): ${refinementQueue.refinementBattleCount}`);
    }
    
    if (!battleStarter) {
      console.error(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ❌ NO BATTLE STARTER - returning empty array`);
      return [];
    }
    
    // CRITICAL FIX: Check refinement queue using actual queue array length
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ===== CHECKING REFINEMENT QUEUE (FIXED) =====`);
    
    const actualQueue = refinementQueue?.queue || refinementQueue?.refinementQueue || [];
    const hasActualBattles = actualQueue.length > 0;
    
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] FIXED Refinement checks:`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - actualQueue: ${JSON.stringify(actualQueue)}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - actualQueue.length: ${actualQueue.length}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - hasActualBattles: ${hasActualBattles}`);
    
    // CRITICAL DEBUG: Try calling getNextRefinementBattle regardless and see what happens
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] DEBUGGING: Calling getNextRefinementBattle regardless of queue state...`);
    let nextRefinement = null;
    try {
      nextRefinement = refinementQueue.getNextRefinementBattle();
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] DEBUGGING: getNextRefinementBattle returned:`, nextRefinement);
    } catch (error) {
      console.error(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] DEBUGGING: getNextRefinementBattle threw error:`, error);
    }
    
    if (hasActualBattles) {
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ✅ REFINEMENT QUEUE HAS ${actualQueue.length} BATTLES!`);
      
      if (nextRefinement) {
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ✅ CREATING REFINEMENT BATTLE!`);
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Primary: ${nextRefinement.primaryPokemonId}, Opponent: ${nextRefinement.opponentPokemonId}`);
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Reason: ${nextRefinement.reason}`);
        
        // TRACE: Get available Pokemon
        const availablePokemon = battleStarter.getAllPokemon();
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Available Pokemon count: ${availablePokemon.length}`);
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Available Pokemon IDs (first 20):`, availablePokemon.slice(0, 20).map(p => p.id));
        
        // TRACE: Find specific Pokemon
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Looking for Pokemon ${nextRefinement.primaryPokemonId} and ${nextRefinement.opponentPokemonId}`);
        
        const primary = availablePokemon.find(p => p.id === nextRefinement.primaryPokemonId);
        const opponent = availablePokemon.find(p => p.id === nextRefinement.opponentPokemonId);
        
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Primary found: ${!!primary} (${primary?.name})`);
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Opponent found: ${!!opponent} (${opponent?.name})`);

        if (primary && opponent) {
          const refinementBattle = [primary, opponent];
          
          console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ✅ SETTING REFINEMENT BATTLE: ${primary.name} vs ${opponent.name}`);
          console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] About to call setCurrentBattle with:`, refinementBattle.map(p => p.name));
          
          setCurrentBattle(refinementBattle);
          setSelectedPokemon([]);
          
          console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ✅ REFINEMENT BATTLE SET - RETURNING IT`);
          return refinementBattle;
        } else {
          console.error(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ❌ POKEMON NOT FOUND IN FILTERED LIST`);
          console.error(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Primary ${nextRefinement.primaryPokemonId} found: ${!!primary}`);
          console.error(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Opponent ${nextRefinement.opponentPokemonId} found: ${!!opponent}`);
          console.error(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] This means the Pokemon are filtered out - popping invalid battle`);
          
          // TRACE: Log the available IDs for debugging
          console.error(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] All available Pokemon IDs:`, availablePokemon.map(p => p.id).sort((a, b) => a - b));
          
          refinementQueue.popRefinementBattle();
          // Try again recursively
          return startNewBattle(battleType);
        }
      } else {
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ❌ getNextRefinementBattle returned null/undefined despite queue having battles`);
        console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] This indicates a problem with the getNextRefinementBattle method`);
      }
    } else {
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ❌ No refinement queue or no battles in queue`);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue exists: ${!!refinementQueue}`);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - actualQueue: ${JSON.stringify(actualQueue)}`);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - actualQueue.length: ${actualQueue.length}`);
    }
    
    // CRITICAL DEBUG: Add logs when falling back to regular generation
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ===== FALLING BACK TO REGULAR GENERATION =====`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Reason: No valid refinement battles found`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] This means either: 1) No queue, 2) Empty queue, 3) Invalid Pokemon in queue`);
    
    // No refinement battles - proceed with regular generation
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ===== NO REFINEMENT BATTLES - REGULAR GENERATION =====`);
    
    const result = battleStarter.startNewBattle(battleType);
    
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Regular battle result:`, result ? result.map(p => `${p.name}(${p.id})`).join(' vs ') : 'null/empty');
    
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ✅ Regular battle set successfully`);
    } else {
      console.error(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ❌ No regular battle generated`);
    }
    
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ===== startNewBattle COMPLETE =====`);
    return result || [];
  };

  const resetSuggestionPriority = () => {
    if (battleStarter) {
      battleStarter.resetSuggestionPriority();
    }
  };

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue // Export refinement queue for use in components
  };
};
