
import { Pokemon } from "@/services/pokemon";

export const useBattleStarterMemory = () => {
  const recentlySeenPokemon = new Set<number>();
  const lastBattlePairs = new Set<string>();
  const battlesCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  const battleTracking = JSON.parse(localStorage.getItem('pokemon-battle-tracking') || '{}');
  const battleSeenIds = new Set<number>(JSON.parse(localStorage.getItem('pokemon-battle-seen') || '[]'));
  
  const RECENT_MEMORY_SIZE = 100;
  const RECENT_PAIRS_MEMORY = 50;

  // Load from storage
  const storedRecent = JSON.parse(localStorage.getItem('pokemon-recent-seen') || '[]');
  storedRecent.forEach((id: number) => recentlySeenPokemon.add(id));

  const storedPairs = JSON.parse(localStorage.getItem('pokemon-recent-pairs') || '[]');
  storedPairs.forEach((pair: string) => lastBattlePairs.add(pair));

  const clearPreviousBattleState = () => {
    console.log(`🧹 [BATTLE_REPEAT_DEBUG] Clearing previous battle state completely`);
    localStorage.removeItem('pokemon-battle-last-battle');
    localStorage.removeItem('pokemon-battle-recently-used');
    
    const currentBattleElement = document.querySelector('[data-battle-container]');
    if (currentBattleElement) {
      console.log(`🧹 [BATTLE_REPEAT_DEBUG] Clearing battle container display`);
    }
    
    console.log("🧹 [BATTLE_STATE_CLEAR] Cleared previous battle state");
  };

  const saveRecentlySeenToStorage = () => {
    const recentArray = Array.from(recentlySeenPokemon).slice(-RECENT_MEMORY_SIZE);
    localStorage.setItem('pokemon-recent-seen', JSON.stringify(recentArray));
    recentlySeenPokemon.clear();
    recentArray.forEach(id => recentlySeenPokemon.add(id));
  };

  const saveRecentPairsToStorage = () => {
    const pairsArray = Array.from(lastBattlePairs).slice(-RECENT_PAIRS_MEMORY);
    localStorage.setItem('pokemon-recent-pairs', JSON.stringify(pairsArray));
    lastBattlePairs.clear();
    pairsArray.forEach(pair => lastBattlePairs.add(pair));
  };

  const addToRecentlySeen = (pokemonId: number) => {
    recentlySeenPokemon.add(pokemonId);
    battleSeenIds.add(pokemonId);
    
    if (recentlySeenPokemon.size > RECENT_MEMORY_SIZE) {
      const recentArray = Array.from(recentlySeenPokemon);
      const toRemove = recentArray.slice(0, recentArray.length - RECENT_MEMORY_SIZE);
      toRemove.forEach(id => recentlySeenPokemon.delete(id));
    }
    
    saveRecentlySeenToStorage();
    localStorage.setItem('pokemon-battle-seen', JSON.stringify(Array.from(battleSeenIds)));
  };

  const addBattlePair = (pokemonIds: number[]) => {
    const sortedIds = [...pokemonIds].sort((a, b) => a - b);
    const pairKey = sortedIds.join('-');
    
    console.log(`📝 [BATTLE_REPEAT_DEBUG] Adding battle pair to history: ${pairKey}`);
    
    lastBattlePairs.add(pairKey);
    
    if (lastBattlePairs.size > RECENT_PAIRS_MEMORY) {
      const pairsArray = Array.from(lastBattlePairs);
      const toRemove = pairsArray.slice(0, pairsArray.length - RECENT_PAIRS_MEMORY);
      toRemove.forEach(pair => lastBattlePairs.delete(pair));
    }
    
    saveRecentPairsToStorage();
  };

  const isPairRecent = (pokemonIds: number[]): boolean => {
    const sortedIds = [...pokemonIds].sort((a, b) => a - b);
    const pairKey = sortedIds.join('-');
    const isRecent = lastBattlePairs.has(pairKey);
    
    console.log(`🔍 [BATTLE_REPEAT_DEBUG] Checking if pair ${pairKey} is recent: ${isRecent ? 'YES' : 'NO'}`);
    
    return isRecent;
  };

  return {
    recentlySeenPokemon,
    lastBattlePairs,
    battlesCount,
    battleTracking,
    battleSeenIds,
    clearPreviousBattleState,
    addToRecentlySeen,
    addBattlePair,
    isPairRecent
  };
};
