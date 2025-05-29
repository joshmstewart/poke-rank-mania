
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
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] THIS IS THE ACTUAL startNewBattle FUNCTION BEING CALLED`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Battle type: ${battleType}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Timestamp: ${new Date().toISOString()}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Call stack:`, new Error().stack?.split('\n').slice(1, 5));
    
    // TRACE: Check all prerequisites
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Prerequisites check:`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - battleStarter exists: ${!!battleStarter}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue exists: ${!!refinementQueue}`);
    
    // CRITICAL FIX: Check refinement queue FIRST ALWAYS
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ===== REFINEMENT QUEUE CHECK (TOP PRIORITY) =====`);
    
    if (refinementQueue) {
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] REFINEMENT QUEUE DEEP INSPECTION:`);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue.hasRefinementBattles:`, refinementQueue.hasRefinementBattles);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - refinementQueue.refinementBattleCount:`, refinementQueue.refinementBattleCount);
      
      // CRITICAL FIX: Use the actual queue arrays directly instead of computed properties
      const actualQueue = refinementQueue.queue || refinementQueue.refinementQueue || [];
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - actual queue array: ${JSON.stringify(actualQueue)}`);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] - actual queue length: ${actualQueue.length}`);
      
      // CRITICAL FIX: ALWAYS check the refinement queue first
      if (actualQueue.length > 0) {
        console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ✅ REFINEMENT QUEUE HAS ${actualQueue.length} BATTLES - USING QUEUE!`);
        
        const nextRefinement = refinementQueue.getNextRefinementBattle();
        console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Next refinement battle:`, nextRefinement);
        
        if (nextRefinement) {
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ✅ CREATING REFINEMENT BATTLE!`);
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Primary: ${nextRefinement.primaryPokemonId}, Opponent: ${nextRefinement.opponentPokemonId}`);
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Reason: ${nextRefinement.reason}`);
          
          // TRACE: Get available Pokemon
          const availablePokemon = battleStarter?.getAllPokemon() || [];
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Available Pokemon count: ${availablePokemon.length}`);
          
          // TRACE: Find specific Pokemon
          const primary = availablePokemon.find(p => p.id === nextRefinement.primaryPokemonId);
          const opponent = availablePokemon.find(p => p.id === nextRefinement.opponentPokemonId);
          
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Primary found: ${!!primary} (${primary?.name})`);
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Opponent found: ${!!opponent} (${opponent?.name})`);

          if (primary && opponent) {
            const refinementBattle = [primary, opponent];
            
            console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ✅ SETTING REFINEMENT BATTLE: ${primary.name} vs ${opponent.name}`);
            console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] About to call setCurrentBattle with:`, refinementBattle.map(p => p.name));
            
            setCurrentBattle(refinementBattle);
            setSelectedPokemon([]);
            
            console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ✅ REFINEMENT BATTLE SET - RETURNING IT`);
            return refinementBattle;
          } else {
            console.error(`🎯 [REFINEMENT_QUEUE_PROCESSING] ❌ POKEMON NOT FOUND IN FILTERED LIST`);
            console.error(`🎯 [REFINEMENT_QUEUE_PROCESSING] Primary ${nextRefinement.primaryPokemonId} found: ${!!primary}`);
            console.error(`🎯 [REFINEMENT_QUEUE_PROCESSING] Opponent ${nextRefinement.opponentPokemonId} found: ${!!opponent}`);
            
            refinementQueue.popRefinementBattle();
            // Try again recursively
            return startNewBattle(battleType);
          }
        } else {
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ❌ getNextRefinementBattle returned null despite queue having battles`);
        }
      } else {
        console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ❌ No refinement queue or no battles in queue`);
        console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] - actualQueue: ${JSON.stringify(actualQueue)}`);
        console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] - actualQueue.length: ${actualQueue.length}`);
      }
    }
    
    if (!battleStarter) {
      console.error(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ❌ NO BATTLE STARTER - returning empty array`);
      return [];
    }
    
    // CRITICAL DEBUG: Add logs when falling back to regular generation
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] ===== FALLING BACK TO REGULAR GENERATION =====`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_ULTRA_TRACE] Reason: No valid refinement battles found`);
    
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
