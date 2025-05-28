
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
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ===== BATTLE GENERATION ENTRY POINT =====`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Battle type: ${battleType}`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] battleStarter exists: ${!!battleStarter}`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] refinementQueue exists: ${!!refinementQueue}`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] allPokemon count: ${allPokemon.length}`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] filteredPokemon count: ${filteredPokemon.length}`);
    
    if (!battleStarter) {
      console.error(`🚨 [CRITICAL_BATTLE_DEBUG] ❌ NO BATTLE STARTER - returning empty array`);
      return [];
    }
    
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ===== REFINEMENT QUEUE CHECK =====`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] refinementQueue.refinementBattleCount: ${refinementQueue.refinementBattleCount}`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] refinementQueue.hasRefinementBattles: ${refinementQueue.hasRefinementBattles}`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] refinementQueue.refinementQueue: ${JSON.stringify(refinementQueue.refinementQueue, null, 2)}`);
    
    // CRITICAL: Check queue IMMEDIATELY
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] getNextRefinementBattle result: ${JSON.stringify(nextRefinement, null, 2)}`);
    
    if (nextRefinement) {
      console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ✅ FOUND REFINEMENT BATTLE!`);
      console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Primary Pokemon ID: ${nextRefinement.primaryPokemonId}`);
      console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Opponent Pokemon ID: ${nextRefinement.opponentPokemonId}`);
      console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Reason: ${nextRefinement.reason}`);
      
      console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ===== POKEMON LOOKUP =====`);
      console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Searching in ${allPokemon.length} total Pokemon`);
      
      const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);
      
      console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Primary Pokemon found: ${!!primary}`);
      if (primary) {
        console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Primary: ${primary.name} (${primary.id})`);
      } else {
        console.error(`🚨 [CRITICAL_BATTLE_DEBUG] ❌ PRIMARY NOT FOUND: ${nextRefinement.primaryPokemonId}`);
        const firstTenIds = allPokemon.slice(0, 10).map(p => `${p.name}(${p.id})`);
        console.log(`🚨 [CRITICAL_BATTLE_DEBUG] First 10 Pokemon IDs: ${firstTenIds.join(', ')}`);
      }
      
      console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Opponent Pokemon found: ${!!opponent}`);
      if (opponent) {
        console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Opponent: ${opponent.name} (${opponent.id})`);
      } else {
        console.error(`🚨 [CRITICAL_BATTLE_DEBUG] ❌ OPPONENT NOT FOUND: ${nextRefinement.opponentPokemonId}`);
      }

      if (primary && opponent) {
        const refinementBattle = [primary, opponent];
        
        console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ===== SETTING REFINEMENT BATTLE =====`);
        console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ✅ Creating refinement battle: ${primary.name} vs ${opponent.name}`);
        console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Setting current battle to: [${refinementBattle.map(p => `${p.name}(${p.id})`).join(', ')}]`);
        
        setCurrentBattle(refinementBattle);
        setSelectedPokemon([]);
        
        console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ✅ REFINEMENT BATTLE SUCCESSFULLY CREATED AND SET`);
        console.log(`🚨 [CRITICAL_BATTLE_DEBUG] This should show the dragged Pokemon in the next battle!`);
        
        return refinementBattle;
      } else {
        console.error(`🚨 [CRITICAL_BATTLE_DEBUG] ❌ MISSING POKEMON - popping invalid battle`);
        refinementQueue.popRefinementBattle();
        
        // Try again recursively
        console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Trying battle generation again...`);
        return startNewBattle(battleType);
      }
    }
    
    // No refinement battles pending
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ===== NO REFINEMENT BATTLES - REGULAR GENERATION =====`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Proceeding with normal battle generation`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Using ${filteredPokemon.length} filtered Pokemon`);
    
    const result = battleStarter.startNewBattle(battleType);
    
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ===== REGULAR BATTLE RESULT =====`);
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] Generated battle: ${result ? result.map(p => `${p.name}(${p.id})`).join(' vs ') : 'null/empty'}`);
    
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
      console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ✅ Regular battle set successfully`);
    } else {
      console.error(`🚨 [CRITICAL_BATTLE_DEBUG] ❌ No regular battle generated`);
    }
    
    console.log(`🚨 [CRITICAL_BATTLE_DEBUG] ===== BATTLE GENERATION COMPLETE =====`);
    return result;
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
