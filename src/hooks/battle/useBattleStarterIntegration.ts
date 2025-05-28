
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
    
    console.log(`🔄 [REFINEMENT_FLOW] ===== Starting new battle =====`);
    console.log(`🔄 [REFINEMENT_FLOW] Battle type: ${battleType}`);
    console.log(`🔄 [REFINEMENT_FLOW] Refinement queue count: ${refinementQueue.refinementBattleCount}`);
    console.log(`🔄 [REFINEMENT_FLOW] Has refinement battles: ${refinementQueue.hasRefinementBattles}`);
    
    // CRITICAL FIX: Always check refinement queue first, before any other battle generation
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    
    if (nextRefinement) {
      console.log(`⚔️ [REFINEMENT_PRIORITY] ✅ Found refinement battle to process`);
      console.log(`⚔️ [REFINEMENT_PRIORITY] Primary Pokemon ID: ${nextRefinement.primaryPokemonId}`);
      console.log(`⚔️ [REFINEMENT_PRIORITY] Opponent Pokemon ID: ${nextRefinement.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_PRIORITY] Reason: ${nextRefinement.reason}`);
      
      // ENHANCED LOGGING: Check if Pokemon exist in filtered list
      const primary = filteredPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
      const opponent = filteredPokemon.find(p => p.id === nextRefinement.opponentPokemonId);
      
      console.log(`🔍 [REFINEMENT_POKEMON_CHECK] Primary Pokemon found: ${!!primary}`);
      if (primary) {
        console.log(`🔍 [REFINEMENT_POKEMON_CHECK] Primary: ${primary.name} (${primary.id})`);
      } else {
        console.error(`🚨 [REFINEMENT_POKEMON_CHECK] Primary Pokemon ${nextRefinement.primaryPokemonId} NOT FOUND in filtered list`);
        console.log(`🔍 [REFINEMENT_POKEMON_CHECK] Checking if it exists in allPokemon...`);
        const primaryInAll = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
        if (primaryInAll) {
          console.error(`🚨 [REFINEMENT_POKEMON_CHECK] Primary ${primaryInAll.name} exists in allPokemon but was FILTERED OUT`);
          console.log(`🚨 [REFINEMENT_POKEMON_CHECK] Checking why it was filtered...`);
          const shouldInclude = shouldIncludePokemon(primaryInAll);
          console.log(`🚨 [REFINEMENT_POKEMON_CHECK] shouldIncludePokemon result: ${shouldInclude}`);
        }
      }
      
      console.log(`🔍 [REFINEMENT_POKEMON_CHECK] Opponent Pokemon found: ${!!opponent}`);
      if (opponent) {
        console.log(`🔍 [REFINEMENT_POKEMON_CHECK] Opponent: ${opponent.name} (${opponent.id})`);
      } else {
        console.error(`🚨 [REFINEMENT_POKEMON_CHECK] Opponent Pokemon ${nextRefinement.opponentPokemonId} NOT FOUND in filtered list`);
      }

      if (primary && opponent) {
        const refinementBattle = [primary, opponent];
        setCurrentBattle(refinementBattle);
        setSelectedPokemon([]);
        
        console.log(`⚔️ [REFINEMENT_PRIORITY] ✅ Successfully created validation battle: ${primary.name} vs ${opponent.name}`);
        console.log(`🔄 [REFINEMENT_FLOW] ===== Refinement battle created =====`);
        return refinementBattle;
      } else {
        console.warn(`⚔️ [REFINEMENT_PRIORITY] ❌ Could not find Pokemon for refinement battle (may have been filtered out):`, nextRefinement);
        console.log(`🔄 [REFINEMENT_FLOW] Popping invalid battle and trying again...`);
        // Pop the invalid battle and try again
        refinementQueue.popRefinementBattle();
        return startNewBattle(battleType);
      }
    }
    
    // No refinement battles pending, proceed with normal battle generation
    console.log(`🎮 [BATTLE_GENERATION] No refinement battles pending, generating regular battle with ${filteredPokemon.length} Pokemon`);
    console.log(`🔄 [REFINEMENT_FLOW] ===== Regular battle generation =====`);
    const result = battleStarter.startNewBattle(battleType);
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
      console.log(`🎮 [BATTLE_GENERATION] ✅ Created regular battle: ${result.map(p => p.name).join(' vs ')}`);
    }
    console.log(`🔄 [REFINEMENT_FLOW] ===== Battle generation complete =====`);
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
