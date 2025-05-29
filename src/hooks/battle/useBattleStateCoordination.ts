
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
  
  // Initialize battle starter
  const { startNewBattle: startNewBattleCore } = useBattleStarterCore(allPokemon, getCurrentRankings);
  const refinementQueue = useSharedRefinementQueue();

  // CRITICAL FIX: Use enhancedStartNewBattle instead of creating our own wrapper
  const startNewBattle = useCallback((battleType: BattleType) => {
    console.log(`🚀 [ENHANCED_START_WIRING] Using enhancedStartNewBattle for type: ${battleType}`);
    return enhancedStartNewBattle(battleType);
  }, [enhancedStartNewBattle]);

  return {
    startNewBattle,
    getCurrentRankings,
    refinementQueue,
    enhancedStartNewBattle
  };
};
