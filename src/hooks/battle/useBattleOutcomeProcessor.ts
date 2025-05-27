
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleOutcomeProcessor = (
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
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
        
        // Increment battles completed
        setBattlesCompleted(prev => prev + 1);
        
        // CRITICAL FIX: Start new battle immediately without delay to prevent empty state
        if (battleStarter) {
          console.log("🔄 [GRAY SCREEN FIX] Starting new battle immediately to prevent empty state");
          const newBattle = battleStarter.startNewBattle(battleType);
          if (!newBattle || newBattle.length === 0) {
            console.error("❌ [GRAY SCREEN FIX] Failed to get new battle, this will cause gray screen");
          } else {
            console.log("✅ [GRAY SCREEN FIX] New battle created successfully:", newBattle.map(p => p.name));
          }
        }
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
        
        // Increment battles completed
        setBattlesCompleted(prev => prev + 1);
        
        // CRITICAL FIX: Start new battle immediately without delay to prevent empty state
        if (battleStarter) {
          console.log("🔄 [GRAY SCREEN FIX] Starting new triplet battle immediately to prevent empty state");
          const newBattle = battleStarter.startNewBattle(battleType);
          if (!newBattle || newBattle.length === 0) {
            console.error("❌ [GRAY SCREEN FIX] Failed to get new triplet battle, this will cause gray screen");
          } else {
            console.log("✅ [GRAY SCREEN FIX] New triplet battle created successfully:", newBattle.map(p => p.name));
          }
        }
      } else {
        console.error("Invalid triplet selection:", { winners, losers, selectedPokemonIds });
      }
    }
  }, [setBattleResults, setBattlesCompleted, battleStarter]);

  return { processBattleResult };
};
