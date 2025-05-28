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
      
      // CRITICAL: Log the last few entries to see the pattern
      const lastFewEntries = recentlyUsed.slice(-5);
      console.log(`🔥🔥🔥 [LAST_FEW_BATTLES] Last 5 battles before adding current: [${lastFewEntries.join(', ')}]`);
      
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
        
        // CRITICAL: Log the new last few entries to track the sequence
        const newLastFewEntries = recentlyUsed.slice(-5);
        console.log(`🔥🔥🔥 [NEW_LAST_FEW_BATTLES] Last 5 battles after adding current: [${newLastFewEntries.join(', ')}]`);
        
        // CRITICAL: Store the battle sequence for pattern analysis
        const battleSequence = {
          battleNumber: battleCount + 1,
          battleKey,
          pokemonNames: currentBattlePokemon.map(p => p.name).join(' vs '),
          timestamp: new Date().toISOString()
        };
        
        const existingSequence = JSON.parse(localStorage.getItem('pokemon-battle-sequence') || '[]');
        existingSequence.push(battleSequence);
        
        // Keep only last 20 battles for analysis
        if (existingSequence.length > 20) {
          existingSequence.splice(0, existingSequence.length - 20);
        }
        
        localStorage.setItem('pokemon-battle-sequence', JSON.stringify(existingSequence));
        
        console.log(`🔥🔥🔥 [BATTLE_SEQUENCE_STORAGE] Stored battle sequence #${battleCount + 1}`);
        console.log(`🔥🔥🔥 [FULL_BATTLE_SEQUENCE] Last 10 battles:`, 
          existingSequence.slice(-10).map(b => `#${b.battleNumber}: ${b.pokemonNames} (${b.battleKey})`));
        
      } else {
        console.log(`🔥🔥🔥 [BATTLE_COMPLETION_TRACKER] ⚠️ Battle key ${battleKey} was already in recently used list!`);
        console.log(`🚨🚨🚨 [DUPLICATE_BATTLE_WARNING] This battle was already completed before! Possible bug!`);
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
