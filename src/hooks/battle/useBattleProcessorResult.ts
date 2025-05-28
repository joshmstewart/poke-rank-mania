import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleProcessorResult = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionUsed?: (pokemon: RankedPokemon, fullyUsed?: boolean) => void
) => {
  const processResultLogic = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    processResult: any,
    battleType: BattleType,
    timestamp: string,
    isResettingRef?: React.MutableRefObject<boolean>
  ) => {
    console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] ===== PROCESSING BATTLE RESULT =====`);
    console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] Current battle Pokemon: ${currentBattlePokemon.map(p => `${p.name} (${p.id})`).join(' vs ')}`);
    console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] Selected winners: ${selectedPokemonIds.join(', ')}`);
    console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] Battle type: ${battleType}`);
    
    // Check recently used BEFORE processing
    const recentlyUsedBefore = JSON.parse(localStorage.getItem('pokemon-battle-recently-used') || '[]');
    console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] Recently used BEFORE processing: ${recentlyUsedBefore.join(', ')}`);
    
    if (isResettingRef?.current) {
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS RESULT: Resetting in progress, skipping`);
      return null;
    }

    const updatedResults = processResult(selectedPokemonIds, currentBattlePokemon, battleType);
    console.log(`📝 [${timestamp}] PROCESS RESULT: Updated results count: ${updatedResults.length}`);
    
    // Add battle pair to recently used list
    if (battleType === "pairs" && currentBattlePokemon.length === 2) {
      const battleKey = currentBattlePokemon.map(p => p.id).sort((a, b) => a - b).join('-');
      const recentlyUsed = JSON.parse(localStorage.getItem('pokemon-battle-recently-used') || '[]');
      
      console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] Adding battle key to recently used: ${battleKey}`);
      console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] Recently used list size before: ${recentlyUsed.length}`);
      
      if (!recentlyUsed.includes(battleKey)) {
        recentlyUsed.push(battleKey);
        
        // Keep only recent battles (last 100)
        if (recentlyUsed.length > 100) {
          const removed = recentlyUsed.splice(0, recentlyUsed.length - 100);
          console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] Removed ${removed.length} old entries: ${removed.join(', ')}`);
        }
        
        localStorage.setItem('pokemon-battle-recently-used', JSON.stringify(recentlyUsed));
        console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] ✅ Added battle key: ${battleKey}`);
        console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] ✅ Recently used list size after: ${recentlyUsed.length}`);
        console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] ✅ Updated recently used: ${recentlyUsed.join(', ')}`);
      } else {
        console.log(`🚨🚨🚨 [BATTLE_RESULT_DEBUG] ⚠️ Battle key ${battleKey} was already in recently used list!`);
      }
    }

    setBattleResults(updatedResults);
    setSelectedPokemon([]);

    return updatedResults;
  }, [setBattleResults, setSelectedPokemon]);

  return { processResultLogic };
};
