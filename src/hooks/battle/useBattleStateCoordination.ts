
import { useCallback, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStarterCore } from "./useBattleStarterCore";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStateInitialization } from "./useBattleStateInitialization";

export const useBattleStateCoordination = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number,
  finalRankings: any[]
) => {
  console.log(`🔧 [COORDINATION] Setting up battle coordination`);
  
  // CRITICAL FIX: Use the initialization hook that provides enhancedStartNewBattle
  const { enhancedStartNewBattle } = useBattleStateInitialization(
    allPokemon,
    initialBattleType,
    initialSelectedGeneration
  );
  
  console.log(`🚨🚨🚨 [ENHANCED_START_WIRING] enhancedStartNewBattle available: ${!!enhancedStartNewBattle}`);
  
  // getCurrentRankings must be defined before other hooks that use it
  const getCurrentRankings = useCallback(() => {
    console.log(`🔧 [RANKINGS_DEBUG] getCurrentRankings called - finalRankings length: ${finalRankings.length}`);
    console.log(`🔧 [RANKINGS_DEBUG] Sample rankings:`, finalRankings.slice(0, 3).map(p => `${p.name} (${p.id})`));
    return finalRankings;
  }, [finalRankings]);
  
  // Initialize battle starter for fallback
  const { startNewBattle: startNewBattleCore } = useBattleStarterCore(allPokemon, getCurrentRankings);
  const refinementQueue = useSharedRefinementQueue();

  // CRITICAL FIX: Always use enhancedStartNewBattle as the primary battle starter
  const startNewBattle = useCallback((battleType: BattleType) => {
    console.log(`🚀 [ENHANCED_START_WIRING] Using enhancedStartNewBattle for type: ${battleType}`);
    console.log(`🚀 [BATTLE_GENERATION_TRACE] Timestamp: ${new Date().toISOString()}`);
    
    // Force a small delay to ensure state updates are processed
    return new Promise<Pokemon[]>((resolve) => {
      setTimeout(() => {
        const result = enhancedStartNewBattle(battleType);
        console.log(`🚀 [BATTLE_GENERATION_TRACE] Enhanced battle result:`, result?.map(p => `${p.name}(${p.id})`).join(' vs ') || 'empty');
        resolve(result || []);
      }, 10);
    });
  }, [enhancedStartNewBattle]);

  return {
    startNewBattle,
    getCurrentRankings,
    refinementQueue,
    enhancedStartNewBattle
  };
};
