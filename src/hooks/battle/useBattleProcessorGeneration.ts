
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleProcessorGeneration = (
  battleStarter?: any,
  integratedStartNewBattle?: (battleType: BattleType, N?: number, ratings?: any) => Pokemon[],
  setCurrentBattle?: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  const refinementQueue = useSharedRefinementQueue();

  const generateNewBattle = useCallback((
    battleType: BattleType,
    timestamp: string,
    N: number = 25,
    ratings: any = {}
  ) => {
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] ===== generateNewBattle CALLED =====`);
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] Timestamp: ${timestamp}`);
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] Battle type: ${battleType}`);
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] Top N: ${N}`);
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] Ratings count: ${Object.keys(ratings).length}`);
    
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] Prerequisites:`);
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] - battleStarter exists: ${!!battleStarter}`);
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] - integratedStartNewBattle exists: ${!!integratedStartNewBattle}`);
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] - setCurrentBattle exists: ${!!setCurrentBattle}`);
    console.log(`🚨🚨🚨 [PROCESSOR_GENERATION_ULTRA_TRACE] - refinementQueue exists: ${!!refinementQueue}`);
    
    // CRITICAL FIX: Actually use the refinement queue HERE instead of just checking it
    if (refinementQueue && refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0) {
      console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ✅ REFINEMENT QUEUE HAS BATTLES - USING QUEUE!`);
      
      const nextRefinement = refinementQueue.getNextRefinementBattle();
      console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Next refinement battle:`, nextRefinement);
      
      if (nextRefinement && battleStarter?.getAllPokemon) {
        const allPokemon = battleStarter.getAllPokemon();
        const primary = allPokemon.find((p: any) => p.id === nextRefinement.primaryPokemonId);
        const opponent = allPokemon.find((p: any) => p.id === nextRefinement.opponentPokemonId);
        
        console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Primary Pokemon found: ${!!primary} (${primary?.name})`);
        console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Opponent Pokemon found: ${!!opponent} (${opponent?.name})`);
        
        if (primary && opponent) {
          const refinementBattle = [primary, opponent];
          
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ✅ CREATING REFINEMENT BATTLE: ${primary.name} vs ${opponent.name}`);
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] Reason: ${nextRefinement.reason}`);
          
          if (setCurrentBattle) {
            setCurrentBattle(refinementBattle);
            console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ✅ setCurrentBattle called with refinement battle`);
          }
          
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ===== RETURNING TRUE (REFINEMENT BATTLE SET) =====`);
          return true;
        } else {
          console.error(`🎯 [REFINEMENT_QUEUE_PROCESSING] ❌ Could not find Pokemon for refinement`);
          refinementQueue.popRefinementBattle();
          // Try again recursively
          return generateNewBattle(battleType, timestamp, N, ratings);
        }
      } else {
        console.error(`🎯 [REFINEMENT_QUEUE_PROCESSING] ❌ Missing nextRefinement or battleStarter.getAllPokemon`);
      }
    } else {
      console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ❌ No refinement battles available`);
      if (refinementQueue) {
        console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] - hasRefinementBattles: ${refinementQueue.hasRefinementBattles}`);
        console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] - refinementBattleCount: ${refinementQueue.refinementBattleCount}`);
      }
    }
    
    // Regular battle generation if no refinements - now with Top N logic
    console.log(`🚀 [REGULAR_BATTLE_GENERATION] No refinement battles - proceeding with Top N generation`);
    
    if (battleStarter && integratedStartNewBattle) {
      console.log(`🚀 [REGULAR_BATTLE_GENERATION] Calling integratedStartNewBattle with N=${N}...`);
      const newBattle = integratedStartNewBattle(battleType, N, ratings);
      if (newBattle && newBattle.length > 0) {
        console.log(`🚀 [REGULAR_BATTLE_GENERATION] New Top N battle generated: ${newBattle.map(p => p.name)}`);
        if (setCurrentBattle) {
          setCurrentBattle(newBattle);
        }
        return true;
      } else {
        console.error(`🚀 [REGULAR_BATTLE_GENERATION] ❌ Failed to generate new battle`);
        return false;
      }
    } else {
      console.error(`🚀 [REGULAR_BATTLE_GENERATION] ❌ Missing battleStarter or integratedStartNewBattle`);
    }
    
    return false;
  }, [battleStarter, integratedStartNewBattle, setCurrentBattle, refinementQueue]);

  return { generateNewBattle };
};
