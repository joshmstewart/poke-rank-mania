
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

    // Create battle result
    const newBattle: SingleBattle = {
      id: `battle-${Date.now()}-${Math.random()}`,
      participants: currentBattle.map(p => ({ id: p.id, name: p.name })),
      winners: selectedPokemonIds,
      battleType,
      timestamp: Date.now()
    };

    console.log('[BATTLE_PROCESSOR_RESULT] Created battle result:', newBattle);

    // Update battle results
    setBattleResults(prev => {
      const updated = [...prev, newBattle];
      console.log(`[BATTLE_PROCESSOR_RESULT] Updated battle results: ${updated.length} total battles`);
      return updated;
    });

    // FIXED: Increment total battle count explicitly
    incrementTotalBattles();
    console.log('[BATTLE_PROCESSOR_RESULT] Incremented total battle count in TrueSkill store');

    // Update battles completed state
    setBattlesCompleted(prev => {
      const newCount = prev + 1;
      console.log(`[BATTLE_PROCESSOR_RESULT] Updated battles completed: ${newCount}`);
      return newCount;
    });

    // Update individual Pokemon battle counts and TrueSkill ratings
    currentBattle.forEach(pokemon => {
      incrementBattleCount(pokemon.id.toString());
      
      // This would be where TrueSkill rating updates happen
      // The actual rating calculation should happen elsewhere
    });

    console.log('[BATTLE_PROCESSOR_RESULT] Battle processing completed');
  }, [currentBattle, battleType, setBattleResults, setBattlesCompleted, incrementTotalBattles, incrementBattleCount]);

  return {
    processBattleResult
  };
};
