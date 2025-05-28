
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
    const battleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    
    console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] ===== COMPLETING BATTLE #${battleCount + 1} =====`);
    console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] Battle: ${currentBattlePokemon.map(p => `${p.name} (${p.id})`).join(' vs ')}`);
    console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] Winners: ${selectedPokemonIds.map(id => {
      const pokemon = currentBattlePokemon.find(p => p.id === id);
      return pokemon ? `${pokemon.name} (${id})` : id;
    }).join(', ')}`);
    console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] Battle type: ${battleType}`);
    
    // CRITICAL FIX: Add battle pair to recently used list FIRST, before processing
    if (battleType === "pairs" && currentBattlePokemon.length === 2) {
      const battleKey = currentBattlePokemon.map(p => p.id).sort((a, b) => a - b).join('-');
      const recentlyUsed = JSON.parse(localStorage.getItem('pokemon-battle-recently-used') || '[]');
      
      console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] ===== UPDATING RECENTLY USED IMMEDIATELY =====`);
      console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] Battle key to add: ${battleKey}`);
      console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] Recently used list size before: ${recentlyUsed.length}`);
      console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] Recently used list before: [${recentlyUsed.join(', ')}]`);
      
      if (!recentlyUsed.includes(battleKey)) {
        recentlyUsed.push(battleKey);
        
        // Keep only recent battles (last 100)
        if (recentlyUsed.length > 100) {
          const removed = recentlyUsed.splice(0, recentlyUsed.length - 100);
          console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] Removed ${removed.length} old entries: [${removed.join(', ')}]`);
        }
        
        localStorage.setItem('pokemon-battle-recently-used', JSON.stringify(recentlyUsed));
        console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] ✅ IMMEDIATELY ADDED battle key: ${battleKey}`);
        console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] ✅ Recently used list size after: ${recentlyUsed.length}`);
        console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] ✅ Updated recently used: [${recentlyUsed.join(', ')}]`);
      } else {
        console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] ⚠️ Battle key ${battleKey} was already in recently used list!`);
      }
      
      console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] ===== END BATTLE #${battleCount + 1} COMPLETION =====`);
    }

    if (isResettingRef?.current) {
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS RESULT: Resetting in progress, skipping`);
      return null;
    }

    const updatedResults = processResult(selectedPokemonIds, currentBattlePokemon, battleType);
    console.log(`📝 [${timestamp}] PROCESS RESULT: Updated results count: ${updatedResults.length}`);
    
    setBattleResults(updatedResults);
    setSelectedPokemon([]);

    return updatedResults;
  }, [setBattleResults, setSelectedPokemon]);

  return { processResultLogic };
};
