
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateData } from "./useBattleStateData";
import { useBattleStateCoordination } from "./useBattleStateCoordination";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStateLogging } from "./useBattleStateLogging";

export const useBattleStateSetup = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🚨🚨🚨 [BATTLE_STATE_SETUP] ===== Setting up battle state =====`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_SETUP] Input params:`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_SETUP] - allPokemon.length: ${allPokemon.length}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_SETUP] - initialBattleType: ${initialBattleType}`);
  console.log(`🚨🚨🚨 [BATTLE_STATE_SETUP] - initialSelectedGeneration: ${initialSelectedGeneration}`);
  
  // Use the state data management hook
  const stateData = useBattleStateData(initialBattleType, initialSelectedGeneration);
  
  // MILESTONE INVESTIGATION: Log milestones from state data
  console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] useBattleStateSetup milestones from stateData:`, stateData.milestones);
  console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] stateData.battlesCompleted:`, stateData.battlesCompleted);
  
  // Use coordination hook for battle management
  const coordination = useBattleStateCoordination(
    allPokemon,
    initialBattleType,
    initialSelectedGeneration,
    stateData.finalRankings
  );
  
  console.log(`🚨🚨🚨 [BATTLE_STATE_SETUP] All state hooks initialized`);
  
  // Use logging hook
  useBattleStateLogging({
    battlesCompleted: stateData.battlesCompleted,
    milestones: stateData.milestones,
    showingMilestone: stateData.showingMilestone,
    rankingGenerated: stateData.rankingGenerated,
    finalRankings: stateData.finalRankings,
    battleHistory: stateData.battleHistory
  });

  const refinementQueue = useSharedRefinementQueue();

  return {
    stateData,
    coordination,
    refinementQueue
  };
};
