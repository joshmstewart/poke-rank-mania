
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
    if (!battleStarter) return [];
    
    console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] ===== Starting new battle =====`);
    console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] Battle type: ${battleType}`);
    console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] Refinement queue instance:`, refinementQueue);
    console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] Refinement queue count: ${refinementQueue.refinementBattleCount}`);
    console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] Has refinement battles: ${refinementQueue.hasRefinementBattles}`);
    console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] Current refinement queue:`, refinementQueue.refinementQueue);
    
    // CRITICAL FIX: Always check refinement queue first, before any other battle generation
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    
    if (nextRefinement) {
      console.log(`⚔️ [REFINEMENT_PRIORITY_CONTEXT_DEBUG] ✅ Found refinement battle to process`);
      console.log(`⚔️ [REFINEMENT_PRIORITY_CONTEXT_DEBUG] Primary Pokemon ID: ${nextRefinement.primaryPokemonId}`);
      console.log(`⚔️ [REFINEMENT_PRIORITY_CONTEXT_DEBUG] Opponent Pokemon ID: ${nextRefinement.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_PRIORITY_CONTEXT_DEBUG] Reason: ${nextRefinement.reason}`);
      
      // CRITICAL FIX: Use allPokemon (unfiltered) for refinement battles to bypass form filters
      console.log(`🔧 [REFINEMENT_BYPASS_FILTER] Using unfiltered allPokemon list for refinement battle`);
      const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);
      
      console.log(`🔍 [REFINEMENT_POKEMON_CHECK_CONTEXT_DEBUG] Primary Pokemon found: ${!!primary}`);
      if (primary) {
        console.log(`🔍 [REFINEMENT_POKEMON_CHECK_CONTEXT_DEBUG] Primary: ${primary.name} (${primary.id})`);
      } else {
        console.error(`🚨 [REFINEMENT_POKEMON_CHECK_CONTEXT_DEBUG] Primary Pokemon ${nextRefinement.primaryPokemonId} NOT FOUND in allPokemon`);
      }
      
      console.log(`🔍 [REFINEMENT_POKEMON_CHECK_CONTEXT_DEBUG] Opponent Pokemon found: ${!!opponent}`);
      if (opponent) {
        console.log(`🔍 [REFINEMENT_POKEMON_CHECK_CONTEXT_DEBUG] Opponent: ${opponent.name} (${opponent.id})`);
      } else {
        console.error(`🚨 [REFINEMENT_POKEMON_CHECK_CONTEXT_DEBUG] Opponent Pokemon ${nextRefinement.opponentPokemonId} NOT FOUND in allPokemon`);
      }

      if (primary && opponent) {
        const refinementBattle = [primary, opponent];
        setCurrentBattle(refinementBattle);
        setSelectedPokemon([]);
        
        console.log(`⚔️ [REFINEMENT_PRIORITY_CONTEXT_DEBUG] ✅ Successfully created validation battle: ${primary.name} vs ${opponent.name}`);
        console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] ===== Refinement battle created =====`);
        return refinementBattle;
      } else {
        console.warn(`⚔️ [REFINEMENT_PRIORITY_CONTEXT_DEBUG] ❌ Could not find Pokemon for refinement battle:`, nextRefinement);
        console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] Popping invalid battle and trying again...`);
        // Pop the invalid battle and try again
        refinementQueue.popRefinementBattle();
        return startNewBattle(battleType);
      }
    }
    
    // No refinement battles pending, proceed with normal battle generation
    console.log(`🎮 [BATTLE_GENERATION_CONTEXT_DEBUG] No refinement battles pending, generating regular battle with ${filteredPokemon.length} Pokemon`);
    console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] ===== Regular battle generation =====`);
    const result = battleStarter.startNewBattle(battleType);
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
      console.log(`🎮 [BATTLE_GENERATION_CONTEXT_DEBUG] ✅ Created regular battle: ${result.map(p => p.name).join(' vs ')}`);
    }
    console.log(`🔄 [REFINEMENT_FLOW_CONTEXT_DEBUG] ===== Battle generation complete =====`);
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
