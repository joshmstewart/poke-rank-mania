
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleGeneration, BattleGenerationResult } from "./useBattleGeneration";

export const useBattleProcessorGeneration = (
  allPokemon: Pokemon[],
  battlesCompleted: number,
  setCurrentBattle?: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  onBattleGenerated?: (strategy: string) => void
) => {
  const refinementQueue = useSharedRefinementQueue();
  const { 
    generateNewBattle: generateBattleWithStrategy, 
    addToRecentlyUsed 
  } = useBattleGeneration(allPokemon);

  const generateNewBattle = useCallback((
    battleType: BattleType,
    timestamp: string,
    N: number = 25,
    ratings: any = {}
  ) => {
    console.log(`[PROCESSOR_GENERATION_REFACTORED] ===== generateNewBattle CALLED =====`);
    console.log(`[PROCESSOR_GENERATION_REFACTORED] Battle type: ${battleType}`);
    console.log(`[PROCESSOR_GENERATION_REFACTORED] Top N: ${N}`);
    
    // Call the correct generation function with the full strategy logic
    const result: BattleGenerationResult = generateBattleWithStrategy(
      battleType,
      battlesCompleted,
      refinementQueue,
      N,
      ratings
    );

    if (result && result.battle.length > 0) {
      const strategy = result.strategy || "Unknown Strategy";
      console.log(`[PROCESSOR_GENERATION_REFACTORED] New battle generated with strategy: ${strategy}`);
      
      if (setCurrentBattle) {
        setCurrentBattle(result.battle);
        addToRecentlyUsed(result.battle);
      }
      
      // Call the callback to update battle log with the correct strategy
      if (onBattleGenerated) {
        onBattleGenerated(strategy);
      }
      
      return true;
    } else {
      console.error(`[PROCESSOR_GENERATION_REFACTORED] ❌ Failed to generate new battle`);
      return false;
    }
  }, [
    generateBattleWithStrategy, 
    battlesCompleted, 
    refinementQueue, 
    setCurrentBattle, 
    onBattleGenerated,
    addToRecentlyUsed
  ]);

  return { generateNewBattle };
};
