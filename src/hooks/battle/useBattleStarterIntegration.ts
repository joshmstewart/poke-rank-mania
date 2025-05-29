
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
    console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ===== BATTLE GENERATION START =====`);
    console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] Battle type: ${battleType}`);
    console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] battleStarter exists: ${!!battleStarter}`);
    console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] refinementQueue exists: ${!!refinementQueue}`);
    console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] refinementQueue.hasRefinementBattles: ${refinementQueue?.hasRefinementBattles}`);
    console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] refinementQueue.refinementBattleCount: ${refinementQueue?.refinementBattleCount}`);
    
    if (!battleStarter) {
      console.error(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ❌ NO BATTLE STARTER - returning empty array`);
      return [];
    }
    
    // CRITICAL FIX: Actually check and USE the refinement queue
    if (refinementQueue && refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0) {
      console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ✅ REFINEMENT QUEUE HAS ${refinementQueue.refinementBattleCount} BATTLES!`);
      const nextRefinement = refinementQueue.getNextRefinementBattle();
      console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] Next refinement:`, nextRefinement);
      
      if (nextRefinement) {
        console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ✅ CREATING REFINEMENT BATTLE!`);
        console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] Primary: ${nextRefinement.primaryPokemonId}, Opponent: ${nextRefinement.opponentPokemonId}`);
        
        const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
        const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);
        
        console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] Primary found: ${!!primary} (${primary?.name})`);
        console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] Opponent found: ${!!opponent} (${opponent?.name})`);

        if (primary && opponent) {
          const refinementBattle = [primary, opponent];
          
          console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ✅ SETTING REFINEMENT BATTLE: ${primary.name} vs ${opponent.name}`);
          
          setCurrentBattle(refinementBattle);
          setSelectedPokemon([]);
          
          console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ✅ REFINEMENT BATTLE SET - RETURNING IT`);
          return refinementBattle;
        } else {
          console.error(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ❌ MISSING POKEMON - popping invalid battle`);
          refinementQueue.popRefinementBattle();
          // Try again recursively
          return startNewBattle(battleType);
        }
      }
    } else {
      console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ❌ No refinement queue or no battles in queue`);
      console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] hasRefinementBattles: ${refinementQueue?.hasRefinementBattles}`);
      console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] refinementBattleCount: ${refinementQueue?.refinementBattleCount}`);
    }
    
    // No refinement battles - proceed with regular generation
    console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ===== NO REFINEMENT BATTLES - REGULAR GENERATION =====`);
    
    const result = battleStarter.startNewBattle(battleType);
    
    console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] Regular battle result:`, result ? result.map(p => `${p.name}(${p.id})`).join(' vs ') : 'null/empty');
    
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
      console.log(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ✅ Regular battle set successfully`);
    } else {
      console.error(`🚨 [BATTLE_STARTER_CRITICAL_FIX] ❌ No regular battle generated`);
    }
    
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
