
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleOutcomeProcessor = (
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleStarter: { startNewBattle: (battleType: BattleType) => Pokemon[] } | null
) => {
  // Process battle result
  const processBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType
  ) => {
    if (!selectedPokemonIds || selectedPokemonIds.length === 0 || !currentBattlePokemon || currentBattlePokemon.length === 0) {
      console.error("Invalid battle data:", { selectedPokemonIds, currentBattlePokemon });
      return;
    }
    
    if (battleType === "pairs") {
      // For pairs, we have a winner and a loser
      const winner = currentBattlePokemon.find(p => selectedPokemonIds.includes(p.id));
      const loser = currentBattlePokemon.find(p => !selectedPokemonIds.includes(p.id));
      
      if (winner && loser) {
        console.log(`Battle result: ${winner.name} beats ${loser.name}`);
        setBattleResults(prev => [...prev, { winner, loser }]);
        
        // Critical fix: Increment battles completed and start a new battle
        setBattlesCompleted(prev => prev + 1);
        
        // Start a new battle after a short delay to let the UI update
        setTimeout(() => {
          if (battleStarter) {
            battleStarter.startNewBattle(battleType);
          }
        }, 300);
      } else {
        console.error("Couldn't determine winner/loser:", { selectedPokemonIds, currentBattlePokemon });
      }
    } else {
      // For triplets, each selected Pokemon beats each unselected one
      const winners = currentBattlePokemon.filter(p => selectedPokemonIds.includes(p.id));
      const losers = currentBattlePokemon.filter(p => !selectedPokemonIds.includes(p.id));
      
      if (winners.length > 0 && losers.length > 0) {
        setBattleResults(prev => {
          const newResults = [...prev];
          winners.forEach(winner => {
            losers.forEach(loser => {
              console.log(`Battle result: ${winner.name} beats ${loser.name}`);
              newResults.push({ winner, loser });
            });
          });
          return newResults;
        });
        
        // Critical fix: Increment battles completed and start a new battle
        setBattlesCompleted(prev => prev + 1);
        
        // Start a new battle after processing
        setTimeout(() => {
          if (battleStarter) {
            battleStarter.startNewBattle(battleType);
          }
        }, 300);
      } else {
        console.error("Invalid triplet selection:", { winners, losers, selectedPokemonIds });
      }
    }
  }, [setBattleResults, setBattlesCompleted, battleStarter]);

  return { processBattleResult };
};
