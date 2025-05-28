
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleOutcomeProcessor = (
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleStarter: any
) => {
  const processBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration?: number
  ) => {
    console.log("🔄 useBattleOutcomeProcessor: Processing battle result", {
      selectedPokemonIds,
      battleType,
      currentBattlePokemon: currentBattlePokemon.map(p => p.name)
    });

    if (battleType === "pairs" && selectedPokemonIds.length === 1) {
      const winnerId = selectedPokemonIds[0];
      const winner = currentBattlePokemon.find(p => p.id === winnerId);
      const loser = currentBattlePokemon.find(p => p.id !== winnerId);

      if (winner && loser) {
        const newResult: SingleBattle = {
          battleType,
          generation: selectedGeneration || 0,
          pokemonIds: currentBattlePokemon.map(p => p.id),
          selectedPokemonIds: selectedPokemonIds,
          timestamp: new Date().toISOString(),
          winner,
          loser
        };

        setBattleResults(prev => [...prev, newResult]);
        setBattlesCompleted(prev => prev + 1);

        if (battleStarter) {
          battleStarter.updateBattleTracking?.(winnerId, [winnerId, loser.id]);
        }

        console.log("✅ useBattleOutcomeProcessor: Battle result processed", {
          winner: winner.name,
          loser: loser.name
        });
      }
    }
  }, [setBattleResults, setBattlesCompleted, battleStarter]);

  return {
    processBattleResult
  };
};
