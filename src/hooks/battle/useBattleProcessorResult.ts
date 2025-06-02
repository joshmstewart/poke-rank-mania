
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { SingleBattle, BattleType } from "./types";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleProcessorResult = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  currentBattle: Pokemon[],
  battleType: BattleType
) => {
  const { incrementTotalBattles, updateRating, incrementBattleCount } = useTrueSkillStore();

  const processBattleResult = useCallback((selectedPokemonIds: number[]) => {
    console.log('[BATTLE_PROCESSOR_RESULT] Processing battle result:', {
      currentBattle: currentBattle.map(p => ({ id: p.id, name: p.name })),
      selectedPokemonIds,
      battleType
    });

    if (!currentBattle || currentBattle.length === 0) {
      console.error('[BATTLE_PROCESSOR_RESULT] No current battle to process');
      return;
    }

    if (selectedPokemonIds.length === 0) {
      console.error('[BATTLE_PROCESSOR_RESULT] No pokemon selected');
      return;
    }

    // Create battle result - matching SingleBattle type structure
    const newBattle: SingleBattle = {
      battleType,
      generation: currentBattle[0]?.generation || 1,
      pokemonIds: currentBattle.map(p => p.id),
      selectedPokemonIds,
      timestamp: Date.now().toString()
    };

    console.log('[BATTLE_PROCESSOR_RESULT] Created battle result:', newBattle);

    // Update battle results
    setBattleResults(prev => {
      const updated = [...prev, newBattle];
      console.log(`[BATTLE_PROCESSOR_RESULT] Updated battle results: ${updated.length} total battles`);
      return updated;
    });

    // Increment total battle count explicitly
    incrementTotalBattles();
    console.log('[BATTLE_PROCESSOR_RESULT] Incremented total battle count in TrueSkill store');

    // Update battles completed state
    setBattlesCompleted(prev => {
      const newCount = prev + 1;
      console.log(`[BATTLE_PROCESSOR_RESULT] Updated battles completed: ${newCount}`);
      return newCount;
    });

    // Update individual Pokemon battle counts
    currentBattle.forEach(pokemon => {
      incrementBattleCount(pokemon.id.toString());
    });

    console.log('[BATTLE_PROCESSOR_RESULT] Battle processing completed');
  }, [currentBattle, battleType, setBattleResults, setBattlesCompleted, incrementTotalBattles, incrementBattleCount]);

  // Add the missing processResultLogic function
  const processResultLogic = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    processResult: any,
    battleType: BattleType,
    timestamp: string,
    isResettingRef?: React.MutableRefObject<boolean>
  ) => {
    console.log('[BATTLE_PROCESSOR_RESULT_LOGIC] Processing result logic');
    
    if (isResettingRef?.current) {
      console.log('[BATTLE_PROCESSOR_RESULT_LOGIC] Reset in progress, skipping');
      return null;
    }
    
    processBattleResult(selectedPokemonIds);
    return battleResults;
  }, [processBattleResult, battleResults]);

  return {
    processBattleResult,
    processResultLogic
  };
};
