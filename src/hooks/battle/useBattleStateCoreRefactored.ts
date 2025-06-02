
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateSetup } from "./useBattleStateSetup";
import { useBattleStateOrchestrator } from "./useBattleStateOrchestrator";
import { useBattleStateReturn } from "./useBattleStateReturn";

export const useBattleStateCoreRefactored = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🚨🚨🚨 [BATTLE_STATE_CORE_REFACTORED] ===== useBattleStateCoreRefactored called =====`);
  
  // Setup phase - initialize state and coordination
  const { stateData, coordination, refinementQueue } = useBattleStateSetup(
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
