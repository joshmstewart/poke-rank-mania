
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleOutcomeProcessor = (
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleStarter: { startNewBattle: (battleType: BattleType) => Pokemon[] } | null,
  setCurrentBattle?: React.Dispatch<React.SetStateAction<Pokemon[]>>
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
        
        // CRITICAL FIX: Generate and set new battle immediately
        if (battleStarter && setCurrentBattle) {
          console.log("🔄 [BATTLE_OUTCOME_FIX] Generating new battle immediately after result processing");
          const newBattle = battleStarter.startNewBattle(battleType);
          if (newBattle && newBattle.length > 0) {
            console.log("✅ [BATTLE_OUTCOME_FIX] New battle generated successfully:", newBattle.map(p => p.name));
            setCurrentBattle(newBattle);
          } else {
            console.error("❌ [BATTLE_OUTCOME_FIX] Failed to generate new battle");
          }
        } else {
          console.warn("⚠️ [BATTLE_OUTCOME_FIX] Missing battleStarter or setCurrentBattle");
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
        
        // CRITICAL FIX: Generate and set new battle immediately
        if (battleStarter && setCurrentBattle) {
          console.log("🔄 [BATTLE_OUTCOME_FIX] Generating new triplet battle immediately after result processing");
          const newBattle = battleStarter.startNewBattle(battleType);
          if (newBattle && newBattle.length > 0) {
            console.log("✅ [BATTLE_OUTCOME_FIX] New triplet battle generated successfully:", newBattle.map(p => p.name));
            setCurrentBattle(newBattle);
          } else {
            console.error("❌ [BATTLE_OUTCOME_FIX] Failed to generate new triplet battle");
          }
        }
      } else {
        console.error("Invalid triplet selection:", { winners, losers, selectedPokemonIds });
      }
    }
  }, [setBattleResults, setBattlesCompleted, battleStarter, setCurrentBattle]);

  return { processBattleResult };
};
