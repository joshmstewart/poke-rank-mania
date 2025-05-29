
import { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { useBattleStateCore } from "@/hooks/battle/useBattleStateCore";

export const useBattleContentState = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number = 0,
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>,
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>
) => {
  const instanceRef = useRef(`content-${Date.now()}`);
  
  console.log(`🔧 [BATTLE_CONTENT_STATE] Hook called - Instance: ${instanceRef.current}`);
  console.log(`🔧 [BATTLE_CONTENT_STATE] allPokemon: ${allPokemon?.length || 0}, initialBattleType: ${initialBattleType}`);

  // Use the simplified core hook
  const stateHook = useBattleStateCore(
    allPokemon || [], 
    initialBattleType, 
    initialSelectedGeneration
  );

  // Update parent state when needed
  useEffect(() => {
    if (setBattlesCompleted) {
      setBattlesCompleted(stateHook.battlesCompleted);
    }
  }, [stateHook.battlesCompleted, setBattlesCompleted]);

  useEffect(() => {
    if (setBattleResults) {
      setBattleResults(stateHook.battleResults);
    }
  }, [stateHook.battleResults, setBattleResults]);

  return {
    instanceRef,
    ...stateHook
  };
};
