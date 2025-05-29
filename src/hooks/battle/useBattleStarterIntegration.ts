
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
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ===== startNewBattle CALLED =====`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Battle type: ${battleType}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Timestamp: ${new Date().toISOString()}`);
    
    // ULTRA DEBUG: Check all prerequisites in extreme detail
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Prerequisites mega-check:`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] - battleStarter exists: ${!!battleStarter}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] - refinementQueue exists: ${!!refinementQueue}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] - filteredPokemon length: ${filteredPokemon.length}`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] - allPokemon length: ${allPokemon.length}`);
    
    // ULTRA DETAILED refinement queue inspection
    if (refinementQueue) {
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] ===== QUEUE DEEP DIVE =====`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - refinementQueue type: ${typeof refinementQueue}`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - refinementQueue keys:`, Object.keys(refinementQueue));
      
      // Check all possible queue properties
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - hasRefinementBattles: ${refinementQueue.hasRefinementBattles}`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - refinementBattleCount: ${refinementQueue.refinementBattleCount}`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - queue: ${JSON.stringify(refinementQueue.queue)}`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - refinementQueue: ${JSON.stringify(refinementQueue.refinementQueue)}`);
      
      // Try to get the actual array directly
      const actualQueue = refinementQueue.queue || refinementQueue.refinementQueue || [];
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - actual queue array: ${JSON.stringify(actualQueue)}`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - actual queue length: ${actualQueue.length}`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - actual queue type: ${typeof actualQueue}`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - actual queue is array: ${Array.isArray(actualQueue)}`);
      
      // Try calling the getter function
      try {
        const nextBattle = refinementQueue.getNextRefinementBattle();
        console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - getNextRefinementBattle result: ${JSON.stringify(nextBattle)}`);
        console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - getNextRefinementBattle type: ${typeof nextBattle}`);
      } catch (error) {
        console.error(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - getNextRefinementBattle ERROR:`, error);
      }
      
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] ===== END QUEUE DEEP DIVE =====`);
      
      // CRITICAL: Check if we should use refinement queue
      const shouldUseQueue = (
        (refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0) ||
        (actualQueue && actualQueue.length > 0)
      );
      
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - SHOULD USE QUEUE: ${shouldUseQueue}`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - Condition 1 (hasRefinementBattles && count > 0): ${refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0}`);
      console.log(`🚨🚨🚨 [REFINEMENT_QUEUE_MEGA_INSPECTION] - Condition 2 (actualQueue.length > 0): ${actualQueue && actualQueue.length > 0}`);
      
      if (shouldUseQueue) {
        console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] ✅ REFINEMENT QUEUE HAS BATTLES - PROCESSING!`);
        
        const nextRefinement = refinementQueue.getNextRefinementBattle();
        console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Next refinement from queue:`, nextRefinement);
        
        if (nextRefinement && nextRefinement.primaryPokemonId && nextRefinement.opponentPokemonId) {
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Valid refinement battle found`);
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] - Primary Pokemon ID: ${nextRefinement.primaryPokemonId}`);
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] - Opponent Pokemon ID: ${nextRefinement.opponentPokemonId}`);
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] - Reason: ${nextRefinement.reason}`);
          
          // Search in ALL available Pokemon (not just filtered) first
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Searching in ALL Pokemon (${allPokemon.length})...`);
          const primaryInAll = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
          const opponentInAll = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);
          
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] In ALL Pokemon - Primary found: ${!!primaryInAll} (${primaryInAll?.name})`);
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] In ALL Pokemon - Opponent found: ${!!opponentInAll} (${opponentInAll?.name})`);
          
          // Search in filtered Pokemon
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Searching in FILTERED Pokemon (${filteredPokemon.length})...`);
          const primaryInFiltered = filteredPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
          const opponentInFiltered = filteredPokemon.find(p => p.id === nextRefinement.opponentPokemonId);
          
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] In FILTERED Pokemon - Primary found: ${!!primaryInFiltered} (${primaryInFiltered?.name})`);
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] In FILTERED Pokemon - Opponent found: ${!!opponentInFiltered} (${opponentInFiltered?.name})`);
          
          // Use the Pokemon that we found (prefer all Pokemon to avoid filter issues)
          const primary = primaryInAll || primaryInFiltered;
          const opponent = opponentInAll || opponentInFiltered;
          
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Final Pokemon selection:`);
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] - Primary selected: ${!!primary} (${primary?.name})`);
          console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] - Opponent selected: ${!!opponent} (${opponent?.name})`);

          if (primary && opponent) {
            const refinementBattle = [primary, opponent];
            
            console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] ✅✅✅ CREATING REFINEMENT BATTLE!`);
            console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Battle: ${primary.name} vs ${opponent.name}`);
            console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Battle IDs: ${primary.id} vs ${opponent.id}`);
            console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Reason: ${nextRefinement.reason}`);
            console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] About to call setCurrentBattle...`);
            
            setCurrentBattle(refinementBattle);
            setSelectedPokemon([]);
            
            console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] ✅✅✅ REFINEMENT BATTLE SET SUCCESSFULLY!`);
            console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Returning refinement battle result`);
            return refinementBattle;
          } else {
            console.error(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] ❌ POKEMON NOT FOUND!`);
            console.error(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Primary ${nextRefinement.primaryPokemonId}: ${!!primary}`);
            console.error(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Opponent ${nextRefinement.opponentPokemonId}: ${!!opponent}`);
            console.error(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] This is likely a filtering issue - the Pokemon exist but are filtered out`);
            
            // Log the first 10 Pokemon IDs for debugging
            console.error(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] First 10 all Pokemon IDs:`, allPokemon.slice(0, 10).map(p => p.id));
            console.error(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] First 10 filtered Pokemon IDs:`, filteredPokemon.slice(0, 10).map(p => p.id));
            
            // Remove invalid battle and try again
            refinementQueue.popRefinementBattle();
            return startNewBattle(battleType);
          }
        } else {
          console.error(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] ❌ Invalid refinement battle object:`, nextRefinement);
          // Remove invalid battle and try again
          refinementQueue.popRefinementBattle();
          return startNewBattle(battleType);
        }
      } else {
        console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] ❌ No refinement battles to process`);
        console.log(`🎯 [REFINEMENT_QUEUE_MEGA_PROCESSING] Will proceed with normal battle generation`);
      }
    } else {
      console.error(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ❌ NO REFINEMENT QUEUE AVAILABLE`);
    }
    
    if (!battleStarter) {
      console.error(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ❌ NO BATTLE STARTER - returning empty array`);
      return [];
    }
    
    // REGULAR GENERATION PATH
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ===== FALLING BACK TO REGULAR GENERATION =====`);
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Calling battleStarter.startNewBattle(${battleType})...`);
    
    const result = battleStarter.startNewBattle(battleType);
    
    console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] Regular battle result:`, result ? result.map(p => `${p.name}(${p.id})`).join(' vs ') : 'null/empty');
    
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
      console.log(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ✅ Regular battle set successfully`);
    } else {
      console.error(`🚨🚨🚨 [BATTLE_STARTER_MEGA_TRACE] ❌ No regular battle generated`);
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
