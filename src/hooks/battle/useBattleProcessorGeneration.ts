
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleProcessorGeneration = (
  battleStarter?: any,
  integratedStartNewBattle?: (battleType: BattleType) => Pokemon[],
  setCurrentBattle?: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  const refinementQueue = useSharedRefinementQueue();

  const generateNewBattle = useCallback((
    battleType: BattleType,
    timestamp: string
  ) => {
    console.log(`📝 [${timestamp}] [BATTLE_OUTCOME_FIX] No milestone hit - generating new battle immediately`);
    console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] Checking refinement queue first before generating battle`);
    console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] Refinement queue exists: ${!!refinementQueue}`);
    
    // CRITICAL DEBUG: Add extensive logging for the refinement queue state
    if (refinementQueue) {
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] DEEP QUEUE INSPECTION:`);
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - refinementQueue keys:`, Object.keys(refinementQueue));
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - refinementQueue.queue:`, refinementQueue.queue);
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - refinementQueue.refinementQueue:`, refinementQueue.refinementQueue);
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - refinementQueue.hasRefinementBattles:`, refinementQueue.hasRefinementBattles);
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - refinementQueue.refinementBattleCount:`, refinementQueue.refinementBattleCount);
      
      const actualQueue = refinementQueue.queue || refinementQueue.refinementQueue || [];
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - actualQueue:`, actualQueue);
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - actualQueue.length:`, actualQueue.length);
      
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] Queue has battles: ${refinementQueue?.hasRefinementBattles}`);
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] Queue count: ${refinementQueue?.refinementBattleCount}`);
    }
    
    // CRITICAL FIX: Check refinement queue FIRST before generating regular battle
    if (refinementQueue && refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0) {
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] ✅ REFINEMENT QUEUE HAS BATTLES - generating refinement battle`);
      
      const nextRefinement = refinementQueue.getNextRefinementBattle();
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] Next refinement battle:`, nextRefinement);
      
      if (nextRefinement && battleStarter?.getAllPokemon) {
        const allPokemon = battleStarter.getAllPokemon();
        const primary = allPokemon.find((p: any) => p.id === nextRefinement.primaryPokemonId);
        const opponent = allPokemon.find((p: any) => p.id === nextRefinement.opponentPokemonId);
        
        console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] Primary Pokemon found: ${!!primary} (${primary?.name})`);
        console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] Opponent Pokemon found: ${!!opponent} (${opponent?.name})`);
        
        if (primary && opponent) {
          const refinementBattle = [primary, opponent];
          
          console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] ✅ CREATING REFINEMENT BATTLE: ${primary.name} vs ${opponent.name}`);
          
          if (setCurrentBattle) {
            setCurrentBattle(refinementBattle);
          }
          
          console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] ✅ Refinement battle set successfully`);
          return true;
        } else {
          console.error(`🔄 [REFINEMENT_INTEGRATION_FIX] ❌ Could not find Pokemon for refinement - popping invalid battle`);
          refinementQueue.popRefinementBattle();
          // Try again recursively
          return generateNewBattle(battleType, timestamp);
        }
      } else {
        console.error(`🔄 [REFINEMENT_INTEGRATION_FIX] ❌ Missing nextRefinement or battleStarter.getAllPokemon`);
        console.error(`🔄 [REFINEMENT_INTEGRATION_FIX] - nextRefinement:`, !!nextRefinement);
        console.error(`🔄 [REFINEMENT_INTEGRATION_FIX] - battleStarter:`, !!battleStarter);
        console.error(`🔄 [REFINEMENT_INTEGRATION_FIX] - battleStarter.getAllPokemon:`, !!battleStarter?.getAllPokemon);
      }
    } else {
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] ❌ No refinement battles available`);
      if (refinementQueue) {
        console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - hasRefinementBattles: ${refinementQueue.hasRefinementBattles}`);
        console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - refinementBattleCount: ${refinementQueue.refinementBattleCount}`);
      } else {
        console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] - refinementQueue is null/undefined`);
      }
    }
    
    // Regular battle generation if no refinements
    console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] No refinement battles - proceeding with regular generation`);
    
    if (battleStarter && integratedStartNewBattle) {
      console.log(`🔄 [REFINEMENT_INTEGRATION_FIX] Calling integratedStartNewBattle...`);
      const newBattle = integratedStartNewBattle(battleType);
      if (newBattle && newBattle.length > 0) {
        console.log(`✅ [BATTLE_OUTCOME_FIX] New battle generated after processing: ${newBattle.map(p => p.name)}`);
        if (setCurrentBattle) {
          setCurrentBattle(newBattle);
        }
        return true;
      } else {
        console.error(`❌ [BATTLE_OUTCOME_FIX] Failed to generate new battle after processing`);
        return false;
      }
    } else {
      console.error(`🔄 [REFINEMENT_INTEGRATION_FIX] Missing battleStarter or integratedStartNewBattle`);
      console.error(`🔄 [REFINEMENT_INTEGRATION_FIX] - battleStarter:`, !!battleStarter);
      console.error(`🔄 [REFINEMENT_INTEGRATION_FIX] - integratedStartNewBattle:`, !!integratedStartNewBattle);
    }
    return false;
  }, [battleStarter, integratedStartNewBattle, setCurrentBattle, refinementQueue]);

  return { generateNewBattle };
};
