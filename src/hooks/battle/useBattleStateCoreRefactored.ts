
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateSetup } from "./useBattleStateSetup";
import { useBattleStateOrchestrator } from "./useBattleStateOrchestrator";
import { useBattleStateReturn } from "./useBattleStateReturn";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStateCoreRefactored = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] ===== useBattleStateCoreRefactored called =====`);
  
  // CRITICAL FIX: Call the hook at the top level where it's valid
  const refinementQueue = useSharedRefinementQueue();
  
  // Setup phase - initialize state and coordination
  const { stateData, coordination } = useBattleStateSetup(
    allPokemon,
    initialBattleType,
    initialSelectedGeneration
  );
  
  // Orchestration phase - wire up all the handlers and processors
  const { milestoneHandlers, handlers, processingHandlers } = useBattleStateOrchestrator(
    allPokemon,
    stateData,
    coordination,
    refinementQueue
  );

  // Return phase - construct the final return object
  return useBattleStateReturn(stateData, milestoneHandlers, handlers, processingHandlers);
};
