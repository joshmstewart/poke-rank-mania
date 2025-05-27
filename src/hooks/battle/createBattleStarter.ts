import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export interface BattleStarter {
  createBattle: (
    battleType: BattleType,
    onMarkSuggestionUsed?: (pokemonId: number) => void
  ) => Pokemon[];
  resetSuggestionPriority: () => void;
  startNewBattle: (battleType: BattleType, forceSuggestion?: boolean, forceUnranked?: boolean) => Pokemon[];
  trackLowerTierLoss: (loserId: number) => void;
}

export function createBattleStarter(
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[] = []
): BattleStarter {
  // CRITICAL FIX: Enhanced battle history tracking to prevent repeats
  const recentlySeenPokemon = new Set<number>();
  const lastBattlePairs = new Set<string>(); // Track recent battle combinations
  const battlesCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  const battleTracking = JSON.parse(localStorage.getItem('pokemon-battle-tracking') || '{}');
  const battleSeenIds = new Set<number>(JSON.parse(localStorage.getItem('pokemon-battle-seen') || '[]'));
  
  let shouldPrioritizeSuggestions = false;
  
  // CRITICAL FIX: Use full Pokemon range, not just subset
  const RECENT_MEMORY_SIZE = Math.min(100, Math.floor(allPokemon.length * 0.1)); // 10% of available Pokemon
  const RECENT_PAIRS_MEMORY = 50; // Remember last 50 battle pairs
  
  console.log(`🎯 [POKEMON_RANGE_FIX] Battle starter created with ${allPokemon.length} total Pokemon`);
  console.log(`🎯 [POKEMON_RANGE_FIX] Pokemon ID range: ${Math.min(...allPokemon.map(p => p.id))} to ${Math.max(...allPokemon.map(p => p.id))}`);

  // Load recently seen Pokemon and battle pairs from storage
  const storedRecent = JSON.parse(localStorage.getItem('pokemon-recent-seen') || '[]');
  storedRecent.forEach((id: number) => recentlySeenPokemon.add(id));

  const storedPairs = JSON.parse(localStorage.getItem('pokemon-recent-pairs') || '[]');
  storedPairs.forEach((pair: string) => lastBattlePairs.add(pair));

  // CRITICAL FIX: Clear previous battle state completely to prevent repeats
  const clearPreviousBattleState = () => {
    localStorage.removeItem('pokemon-battle-last-battle');
    localStorage.removeItem('pokemon-battle-recently-used');
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
    // Create a consistent pair key (sorted IDs)
    const sortedIds = [...pokemonIds].sort((a, b) => a - b);
    const pairKey = sortedIds.join('-');
    
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
    return lastBattlePairs.has(pairKey);
  };

  const resetSuggestionPriority = () => {
    shouldPrioritizeSuggestions = true;
    console.log("🚨 Battle starter: Suggestion priority reset - will prioritize suggestions");
  };

  window.addEventListener("prioritizeSuggestions", () => {
    resetSuggestionPriority();
  });

  const createBattle = (
    battleType: BattleType,
    onMarkSuggestionUsed?: (pokemonId: number) => void
  ): Pokemon[] => {
    // CRITICAL FIX: Clear previous battle state before creating new battle
    clearPreviousBattleState();
    
    const battleSize = battleType === "triplets" ? 3 : 2;
    const availablePokemon = allPokemon;
    
    console.log(`🎮 [BATTLE_REPEAT_FIX] Creating ${battleType} battle #${battlesCount + 1} from FULL pool of ${availablePokemon.length} Pokemon`);
    
    // Better filtering to avoid recent Pokemon
    let candidatePokemon = availablePokemon.filter(p => !recentlySeenPokemon.has(p.id));
    
    if (candidatePokemon.length < battleSize * 3) {
      const recentArray = Array.from(recentlySeenPokemon);
      const lessRecentThreshold = Math.floor(recentArray.length * 0.5);
      const lessRecent = new Set(recentArray.slice(0, lessRecentThreshold));
      
      candidatePokemon = availablePokemon.filter(p => !lessRecent.has(p.id));
      console.log(`⚠️ Expanded candidate pool by including less recent Pokemon: ${candidatePokemon.length} available`);
    }
    
    if (candidatePokemon.length < battleSize) {
      candidatePokemon = availablePokemon;
      console.log(`⚠️ Using full pool due to insufficient candidates: ${candidatePokemon.length}`);
    }

    // SUGGESTION PRIORITY: Handle suggestions with improved logic
    const suggestedPokemon = currentRankings
      .filter(p => p.suggestedAdjustment && !p.suggestedAdjustment.used)
      .filter(p => candidatePokemon.some(cp => cp.id === p.id));

    let battlePokemon: Pokemon[] = [];
    let attempts = 0;
    const maxAttempts = 10;

    // CRITICAL FIX: Try multiple times to avoid repeated battle pairs
    while (attempts < maxAttempts) {
      battlePokemon = [];
      
      if (shouldPrioritizeSuggestions && suggestedPokemon.length >= 1) {
        console.log(`⭐ Prioritizing suggestions: Found ${suggestedPokemon.length} suggested Pokemon`);
        
        const selectedSuggestion = suggestedPokemon[Math.floor(Math.random() * suggestedPokemon.length)];
        battlePokemon.push(selectedSuggestion);
        
        if (onMarkSuggestionUsed) {
          onMarkSuggestionUsed(selectedSuggestion.id);
          console.log(`✅ Marked suggestion as used: ${selectedSuggestion.name}`);
        }
        
        const nonSuggestedCandidates = candidatePokemon.filter(
          p => !suggestedPokemon.some(sp => sp.id === p.id) && 
              !battlePokemon.some(bp => bp.id === p.id)
        );
        
        const remainingSlots = battleSize - 1;
        const shuffled = nonSuggestedCandidates.sort(() => Math.random() - 0.5);
        battlePokemon.push(...shuffled.slice(0, remainingSlots));
        
        shouldPrioritizeSuggestions = false;
      } else {
        // Better randomization with weighted selection
        const weightedCandidates = candidatePokemon.map(pokemon => {
          let weight = 1.0;
          
          if (recentlySeenPokemon.has(pokemon.id)) {
            weight *= 0.3;
          }
          
          const timesSeenInBattles = battleTracking[pokemon.id] || 0;
          if (timesSeenInBattles === 0) {
            weight *= 1.5;
          } else if (timesSeenInBattles < 3) {
            weight *= 1.2;
          }
          
          return { pokemon, weight };
        });
        
        // Weighted random selection
        for (let i = 0; i < battleSize; i++) {
          if (weightedCandidates.length === 0) break;
          
          const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
          let random = Math.random() * totalWeight;
          
          let selectedIndex = 0;
          for (let j = 0; j < weightedCandidates.length; j++) {
            random -= weightedCandidates[j].weight;
            if (random <= 0) {
              selectedIndex = j;
              break;
            }
          }
          
          const selected = weightedCandidates[selectedIndex];
          battlePokemon.push(selected.pokemon);
          weightedCandidates.splice(selectedIndex, 1);
        }
      }

      // CRITICAL FIX: Check if this battle combination was recent
      const battleIds = battlePokemon.map(p => p.id);
      if (!isPairRecent(battleIds) || attempts >= maxAttempts - 1) {
        console.log(`🎮 [BATTLE_REPEAT_FIX] Battle pair ${battleIds.join('-')} is ${isPairRecent(battleIds) ? 'RECENT but using anyway (max attempts)' : 'FRESH'}`);
        break;
      } else {
        console.log(`🔄 [BATTLE_REPEAT_FIX] Battle pair ${battleIds.join('-')} was recent, trying again (attempt ${attempts + 1})`);
        attempts++;
      }
    }

    // Track battle participation and pair
    const battleIds = battlePokemon.map(p => p.id);
    addBattlePair(battleIds);
    
    battlePokemon.forEach(pokemon => {
      addToRecentlySeen(pokemon.id);
      battleTracking[pokemon.id] = (battleTracking[pokemon.id] || 0) + 1;
      
      // CRITICAL FIX: Log Pokemon type data to debug color issue
      console.log(`🎯 [TYPE_DEBUG] Battle Pokemon: ${pokemon.name} (ID: ${pokemon.id})`);
      console.log(`🎯 [TYPE_DEBUG] - Raw types:`, pokemon.types);
      console.log(`🎯 [TYPE_DEBUG] - Types is array:`, Array.isArray(pokemon.types));
      console.log(`🎯 [TYPE_DEBUG] - Types length:`, pokemon.types?.length || 0);
      if (pokemon.types && pokemon.types.length > 0) {
        console.log(`🎯 [TYPE_DEBUG] - First type:`, pokemon.types[0]);
        console.log(`🎯 [TYPE_DEBUG] - Type of first element:`, typeof pokemon.types[0]);
      } else {
        console.error(`🚨 [TYPE_DEBUG] - NO TYPES FOUND for ${pokemon.name}!`);
      }
    });

    localStorage.setItem('pokemon-battle-tracking', JSON.stringify(battleTracking));
    localStorage.setItem('pokemon-battle-count', (battlesCount + 1).toString());

    console.log(`✅ [BATTLE_REPEAT_FIX] Created battle with Pokemon IDs: [${battleIds.join(', ')}] after ${attempts + 1} attempts`);
    console.log(`✅ [BATTLE_REPEAT_FIX] Pokemon names: [${battlePokemon.map(p => p.name).join(', ')}]`);
    return battlePokemon;
  };

  const startNewBattle = (battleType: BattleType, forceSuggestion?: boolean, forceUnranked?: boolean): Pokemon[] => {
    return createBattle(battleType);
  };

  return {
    createBattle,
    resetSuggestionPriority,
    startNewBattle,
    trackLowerTierLoss: (loserId: number) => {
      console.log(`Tracking lower tier loss for Pokemon ID: ${loserId}`);
    }
  };
}
