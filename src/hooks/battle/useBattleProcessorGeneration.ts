
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleProcessorGeneration = (
  battleStarter?: any,
  integratedStartNewBattle?: (battleType: BattleType, N?: number, ratings?: any) => Pokemon[],
  setCurrentBattle?: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  onBattleGenerated?: (strategy: string) => void
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
    
    // Regular battle generation with Top N logic
    console.log(`🚀 [REGULAR_BATTLE_GENERATION] Proceeding with Top N generation`);
    
    if (battleStarter && integratedStartNewBattle) {
      console.log(`🚀 [REGULAR_BATTLE_GENERATION] Calling integratedStartNewBattle with N=${N}...`);
      const newBattle = integratedStartNewBattle(battleType, N, ratings);
      if (newBattle && newBattle.length > 0) {
        const strategy = `Top ${N} battle generated (${battleType})`;
        console.log(`🚀 [REGULAR_BATTLE_GENERATION] New Top N battle generated: ${newBattle.map(p => p.name)}`);
        console.log(`🚀 [REGULAR_BATTLE_GENERATION] Strategy: ${strategy}`);
        
        if (setCurrentBattle) {
          setCurrentBattle(newBattle);
        }
        
        // Call the callback to update battle log
        if (onBattleGenerated) {
          onBattleGenerated(strategy);
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
  }, [battleStarter, integratedStartNewBattle, setCurrentBattle, refinementQueue, onBattleGenerated]);

  return { generateNewBattle };
};
