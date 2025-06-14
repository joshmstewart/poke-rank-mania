
import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleGeneration } from "./useBattleGeneration";

interface BattleStarterConfig {
  allPokemon: Pokemon[];
  currentRankings: RankedPokemon[];
  battleType: BattleType;
  selectedGeneration: number;
  freezeList: number[];
  N?: number;
  ratings?: any;
}

export const useBattleStarterCore = (
  allPokemon: Pokemon[],
  getCurrentRankings: () => RankedPokemon[]
) => {
  const { generateNewBattle } = useBattleGeneration(allPokemon);

  const startNewBattle = useCallback((config: BattleStarterConfig): Pokemon[] => {
    const { 
      battleType, 
      N = 25, 
      ratings = {},
      allPokemon: configPokemon 
    } = config;
    
    console.log(`🎯 [BATTLE_STARTER_CORE] Starting new Top N battle with N=${N}`);
    console.log(`🎯 [BATTLE_STARTER_CORE] Battle type: ${battleType}`);
    console.log(`🎯 [BATTLE_STARTER_CORE] Available Pokemon: ${configPokemon.length}`);
    console.log(`🎯 [BATTLE_STARTER_CORE] Ratings available: ${Object.keys(ratings).length}`);

    // Use the new Top N battle generation logic
    const battle = generateNewBattle(
      battleType,
      0, // battlesCompleted - not used in Top N logic
      undefined, // refinementQueue - handled elsewhere
      N,
      ratings
    );

    console.log(`🎯 [BATTLE_STARTER_CORE] Generated battle:`, battle.map(p => `${p.name}(${p.id})`));
    
    return battle;
  }, [generateNewBattle]);

  return {
    startNewBattle
  };
};
