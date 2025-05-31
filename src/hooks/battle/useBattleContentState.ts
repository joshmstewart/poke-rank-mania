
import React, { useRef, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleStateCore } from "./useBattleStateCore";

export const useBattleContentState = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number,
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>,
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>
) => {
  const instanceRef = useRef(`battle-content-${Date.now()}-${Math.random()}`);
  
  console.log(`🔧 [BATTLE_CONTENT_STATE] Instance: ${instanceRef.current}`);
  console.log(`🔧 [BATTLE_CONTENT_STATE] Pokemon: ${allPokemon?.length || 0}, Type: ${initialBattleType}, Gen: ${initialSelectedGeneration}`);

  // Use the core battle state hook
  const coreState = useBattleStateCore(allPokemon, initialBattleType, initialSelectedGeneration);

  // CRITICAL FIX: Enhanced onRankingsUpdate that uses TrueSkill store consistency
  const onRankingsUpdate = useCallback((updatedRankings: any[]) => {
    console.log(`🔧 [BATTLE_CONTENT_RANKINGS_UPDATE] ===== RANKINGS UPDATE =====`);
    console.log(`🔧 [BATTLE_CONTENT_RANKINGS_UPDATE] Updated rankings count: ${updatedRankings.length}`);
    
    // In Battle Mode context, we want to maintain TrueSkill store consistency
    // The rankings are already updated through TrueSkill during battle processing
    // So we primarily use this for milestone display consistency
    
    console.log(`🔧 [BATTLE_CONTENT_RANKINGS_UPDATE] Rankings update received, TrueSkill store handles persistence`);
  }, []);

  // CRITICAL FIX: Sync external battle state setters
  const { battlesCompleted, battleResults } = coreState;
  
  // Update external state when internal state changes
  React.useEffect(() => {
    if (setBattlesCompleted) {
      setBattlesCompleted(battlesCompleted);
    }
  }, [battlesCompleted, setBattlesCompleted]);

  React.useEffect(() => {
    if (setBattleResults) {
      setBattleResults(battleResults);
    }
  }, [battleResults, setBattleResults]);

  return {
    instanceRef,
    ...coreState,
    onRankingsUpdate
  };
};
