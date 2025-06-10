
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
  const { shouldIncludePokemon, analyzeFilteringPipeline } = useFormFilters();
  
  // Filter Pokemon based on form filters before creating battle starter
  const filteredPokemon = useMemo(() => {
    console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] ===== STARTING POKEMON FILTERING =====`);
    console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] Input Pokemon count: ${allPokemon.length}`);
    
    if (allPokemon.length > 0) {
      const inputIds = allPokemon.map(p => p.id);
      const inputMinId = Math.min(...inputIds);
      const inputMaxId = Math.max(...inputIds);
      console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] Input ID range: ${inputMinId} - ${inputMaxId}`);
      
      // Sample some Pokemon from input
      const sampleLow = allPokemon.filter(p => p.id <= 150).slice(0, 5);
      const sampleHigh = allPokemon.filter(p => p.id >= 800).slice(0, 5);
      console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] Sample low ID input: ${sampleLow.map(p => `${p.name}(${p.id})`).join(', ')}`);
      console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] Sample high ID input: ${sampleHigh.map(p => `${p.name}(${p.id})`).join(', ')}`);
    }

    // Apply form filters and use the analysis function
    const filtered = analyzeFilteringPipeline(allPokemon);
    
    console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] After form filtering: ${filtered.length} Pokemon`);
    
    if (filtered.length > 0) {
      const filteredIds = filtered.map(p => p.id);
      const filteredMinId = Math.min(...filteredIds);
      const filteredMaxId = Math.max(...filteredIds);
      console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] Filtered ID range: ${filteredMinId} - ${filteredMaxId}`);
      
      // Sample some Pokemon from filtered output
      const sampleLowFiltered = filtered.filter(p => p.id <= 150).slice(0, 5);
      const sampleHighFiltered = filtered.filter(p => p.id >= 800).slice(0, 5);
      console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] Sample low ID filtered: ${sampleLowFiltered.map(p => `${p.name}(${p.id})`).join(', ')}`);
      console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] Sample high ID filtered: ${sampleHighFiltered.map(p => `${p.name}(${p.id})`).join(', ')}`);
      
      // Check distribution
      const distribution = {
        '1-150': filteredIds.filter(id => id >= 1 && id <= 150).length,
        '151-300': filteredIds.filter(id => id >= 151 && id <= 300).length,
        '301-500': filteredIds.filter(id => id >= 301 && id <= 500).length,
        '501-700': filteredIds.filter(id => id >= 501 && id <= 700).length,
        '701-900': filteredIds.filter(id => id >= 701 && id <= 900).length,
        '901+': filteredIds.filter(id => id >= 901).length,
      };
      console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] Filtered distribution:`, distribution);
    }
    
    console.log(`🔍🔍🔍 [INTEGRATION_FILTER_DEBUG] ===== FILTERING COMPLETE =====`);
    
    return filtered;
  }, [allPokemon, shouldIncludePokemon, analyzeFilteringPipeline]);

  const battleStarter = useMemo(() => {
    if (!filteredPokemon || filteredPokemon.length === 0) return null;
    
    console.log(`🎯🎯🎯 [BATTLE_STARTER_DEBUG] Creating battleStarter with ${filteredPokemon.length} filtered Pokemon (from ${allPokemon.length} total)`);
    return createBattleStarter(filteredPokemon, currentRankings);
  }, [filteredPokemon, currentRankings]);

  // Use shared refinement queue instead of creating a new instance
  const refinementQueue = useSharedRefinementQueue();

  const startNewBattle = (battleType: any) => {
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ===== startNewBattle CALLED =====`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Battle type: ${battleType}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Filtered Pokemon available: ${filteredPokemon.length}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Timestamp: ${new Date().toISOString()}`);
    
    if (!battleStarter) {
      console.error(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ❌ NO BATTLE STARTER - returning empty array`);
      return [];
    }
    
    // CRITICAL FIX: Check refinement queue FIRST before calling battle starter
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ===== CHECKING REFINEMENT QUEUE FIRST =====`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Refinement queue exists: ${!!refinementQueue}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Refinement queue has battles: ${refinementQueue?.hasRefinementBattles}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Refinement queue count: ${refinementQueue?.refinementBattleCount}`);
    
    // CRITICAL FIX: If there are refinement battles, generate them directly here
    if (refinementQueue?.hasRefinementBattles && refinementQueue.getNextRefinementBattle) {
      console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ===== GENERATING REFINEMENT BATTLE =====`);
      
      const nextBattle = refinementQueue.getNextRefinementBattle();
      if (nextBattle) {
        console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Next refinement battle: ${nextBattle.primaryPokemonId} vs ${nextBattle.opponentPokemonId}`);
        
        // Find the Pokemon objects for the battle
        const pokemon1 = filteredPokemon.find(p => p.id === nextBattle.primaryPokemonId);
        const pokemon2 = filteredPokemon.find(p => p.id === nextBattle.opponentPokemonId);
        
        if (pokemon1 && pokemon2) {
          console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ✅ REFINEMENT BATTLE GENERATED: ${pokemon1.name} vs ${pokemon2.name}`);
          const result = [pokemon1, pokemon2];
          
          setCurrentBattle(result);
          setSelectedPokemon([]);
          
          // Remove the battle from the queue since we're using it
          refinementQueue.popRefinementBattle();
          
          return result;
        } else {
          console.error(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ❌ Could not find Pokemon for refinement battle: ${nextBattle.primaryPokemonId}, ${nextBattle.opponentPokemonId}`);
        }
      } else {
        console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ⚠️ No next refinement battle available despite hasRefinementBattles being true`);
      }
    }
    
    // Fall back to normal battle generation if no refinement battles
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ===== CALLING NORMAL BATTLE STARTER =====`);
    const result = battleStarter.startNewBattle(battleType, refinementQueue);
    
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Battle result:`, result ? result.map(p => `${p.name}(${p.id})`).join(' vs ') : 'null/empty');
    
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ✅ Battle set successfully`);
    } else {
      console.error(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ❌ No battle generated`);
    }
    
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ===== startNewBattle COMPLETE =====`);
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
