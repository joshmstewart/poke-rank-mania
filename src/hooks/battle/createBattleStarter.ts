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
  // REPETITION FIX: Improved tracking and pool management
  const recentlySeenPokemon = new Set<number>();
  const battlesCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  const battleTracking = JSON.parse(localStorage.getItem('pokemon-battle-tracking') || '{}');
  const battleSeenIds = new Set<number>(JSON.parse(localStorage.getItem('pokemon-battle-seen') || '[]'));
  
  let shouldPrioritizeSuggestions = false;
  
  // REPETITION FIX: Larger recent memory and better cycling
  const RECENT_MEMORY_SIZE = Math.min(50, Math.floor(allPokemon.length * 0.15)); // 15% of available Pokemon
  const EARLY_SUBSET_SIZE = Math.min(200, Math.floor(allPokemon.length * 0.3)); // 30% for early battles
  const EARLY_BATTLE_THRESHOLD = 25; // First 25 battles use subset

  // Load recently seen Pokemon from storage
  const storedRecent = JSON.parse(localStorage.getItem('pokemon-recent-seen') || '[]');
  storedRecent.forEach((id: number) => recentlySeenPokemon.add(id));

  const saveRecentlySeenToStorage = () => {
    const recentArray = Array.from(recentlySeenPokemon).slice(-RECENT_MEMORY_SIZE);
    localStorage.setItem('pokemon-recent-seen', JSON.stringify(recentArray));
    recentlySeenPokemon.clear();
    recentArray.forEach(id => recentlySeenPokemon.add(id));
  };

  const addToRecentlySeen = (pokemonId: number) => {
    recentlySeenPokemon.add(pokemonId);
    battleSeenIds.add(pokemonId);
    
    // Keep only the most recent entries
    if (recentlySeenPokemon.size > RECENT_MEMORY_SIZE) {
      const recentArray = Array.from(recentlySeenPokemon);
      const toRemove = recentArray.slice(0, recentArray.length - RECENT_MEMORY_SIZE);
      toRemove.forEach(id => recentlySeenPokemon.delete(id));
    }
    
    saveRecentlySeenToStorage();
    localStorage.setItem('pokemon-battle-seen', JSON.stringify(Array.from(battleSeenIds)));
  };

  // REPETITION FIX: Improved early battle subset with rotation
  const getEarlyBattleSubset = (): Pokemon[] => {
    const cycleSize = Math.min(EARLY_SUBSET_SIZE, allPokemon.length);
    const currentCycle = Math.floor(battlesCount / (EARLY_BATTLE_THRESHOLD / 3)); // Rotate every ~8 battles
    const startIndex = (currentCycle * Math.floor(cycleSize * 0.7)) % allPokemon.length;
    
    const subset: Pokemon[] = [];
    for (let i = 0; i < cycleSize; i++) {
      const index = (startIndex + i) % allPokemon.length;
      subset.push(allPokemon[index]);
    }
    
    console.log(`🔄 Early battle subset: Cycle ${currentCycle}, starting at index ${startIndex}, size ${subset.length}`);
    return subset;
  };

  const resetSuggestionPriority = () => {
    shouldPrioritizeSuggestions = true;
    console.log("🚨 Battle starter: Suggestion priority reset - will prioritize suggestions");
  };

  // Listen for suggestion prioritization events
  window.addEventListener("prioritizeSuggestions", () => {
    resetSuggestionPriority();
  });

  const createBattle = (
    battleType: BattleType,
    onMarkSuggestionUsed?: (pokemonId: number) => void
  ): Pokemon[] => {
    const battleSize = battleType === "triplets" ? 3 : 2;
    const availablePokemon = battlesCount < EARLY_BATTLE_THRESHOLD ? getEarlyBattleSubset() : allPokemon;
    
    console.log(`🎮 Creating ${battleType} battle #${battlesCount + 1} from pool of ${availablePokemon.length} Pokemon`);
    
    // REPETITION FIX: Better filtering to avoid recent Pokemon
    let candidatePokemon = availablePokemon.filter(p => !recentlySeenPokemon.has(p.id));
    
    // If we've filtered out too many, gradually add some back
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

    if (shouldPrioritizeSuggestions && suggestedPokemon.length >= 1) {
      console.log(`⭐ Prioritizing suggestions: Found ${suggestedPokemon.length} suggested Pokemon`);
      
      // Include 1 suggested Pokemon per battle
      const selectedSuggestion = suggestedPokemon[Math.floor(Math.random() * suggestedPokemon.length)];
      battlePokemon.push(selectedSuggestion);
      
      if (onMarkSuggestionUsed) {
        onMarkSuggestionUsed(selectedSuggestion.id);
        console.log(`✅ Marked suggestion as used: ${selectedSuggestion.name}`);
      }
      
      // Fill remaining slots with non-suggested Pokemon
      const nonSuggestedCandidates = candidatePokemon.filter(
        p => !suggestedPokemon.some(sp => sp.id === p.id) && 
            !battlePokemon.some(bp => bp.id === p.id)
      );
      
      const remainingSlots = battleSize - 1;
      const shuffled = nonSuggestedCandidates.sort(() => Math.random() - 0.5);
      battlePokemon.push(...shuffled.slice(0, remainingSlots));
      
      shouldPrioritizeSuggestions = false;
    } else {
      // REPETITION FIX: Better randomization with weighted selection
      const weightedCandidates = candidatePokemon.map(pokemon => {
        let weight = 1.0;
        
        // Reduce weight for recently seen (but not excluded) Pokemon
        if (recentlySeenPokemon.has(pokemon.id)) {
          weight *= 0.3;
        }
        
        // Slightly increase weight for Pokemon that haven't been seen much
        const timesSeenInBattles = battleTracking[pokemon.id] || 0;
        if (timesSeenInBattles === 0) {
          weight *= 1.5; // Favor unseen Pokemon
        } else if (timesSeenInBattles < 3) {
          weight *= 1.2; // Slightly favor rarely seen Pokemon
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

    // Track battle participation
    battlePokemon.forEach(pokemon => {
      addToRecentlySeen(pokemon.id);
      battleTracking[pokemon.id] = (battleTracking[pokemon.id] || 0) + 1;
    });

    localStorage.setItem('pokemon-battle-tracking', JSON.stringify(battleTracking));
    localStorage.setItem('pokemon-battle-count', (battlesCount + 1).toString());

    console.log(`✅ Created battle with: ${battlePokemon.map(p => p.name).join(', ')}`);
    return battlePokemon;
  };

  const startNewBattle = (battleType: BattleType, forceSuggestion?: boolean, forceUnranked?: boolean): Pokemon[] => {
    const battleSize = battleType === "triplets" ? 3 : 2;
    const availablePokemon = battlesCount < EARLY_BATTLE_THRESHOLD ? getEarlyBattleSubset() : allPokemon;
    
    console.log(`🎮 Creating ${battleType} battle #${battlesCount + 1} from pool of ${availablePokemon.length} Pokemon`);
    
    // REPETITION FIX: Better filtering to avoid recent Pokemon
    let candidatePokemon = availablePokemon.filter(p => !recentlySeenPokemon.has(p.id));
    
    // If we've filtered out too many, gradually add some back
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

    if (forceSuggestion && suggestedPokemon.length >= 1) {
      console.log(`⭐ Forcing suggestions: Found ${suggestedPokemon.length} suggested Pokemon`);
      
      // Include 1 suggested Pokemon per battle
      const selectedSuggestion = suggestedPokemon[Math.floor(Math.random() * suggestedPokemon.length)];
      battlePokemon.push(selectedSuggestion);
      
      // Fill remaining slots with non-suggested Pokemon
      const nonSuggestedCandidates = candidatePokemon.filter(
        p => !suggestedPokemon.some(sp => sp.id === p.id) && 
            !battlePokemon.some(bp => bp.id === p.id)
      );
      
      const remainingSlots = battleSize - 1;
      const shuffled = nonSuggestedCandidates.sort(() => Math.random() - 0.5);
      battlePokemon.push(...shuffled.slice(0, remainingSlots));
    } else {
      // REPETITION FIX: Better randomization with weighted selection
      const weightedCandidates = candidatePokemon.map(pokemon => {
        let weight = 1.0;
        
        // Reduce weight for recently seen (but not excluded) Pokemon
        if (recentlySeenPokemon.has(pokemon.id)) {
          weight *= 0.3;
        }
        
        // Slightly increase weight for Pokemon that haven't been seen much
        const timesSeenInBattles = battleTracking[pokemon.id] || 0;
        if (timesSeenInBattles === 0) {
          weight *= 1.5; // Favor unseen Pokemon
        } else if (timesSeenInBattles < 3) {
          weight *= 1.2; // Slightly favor rarely seen Pokemon
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

    // Track battle participation
    battlePokemon.forEach(pokemon => {
      addToRecentlySeen(pokemon.id);
      battleTracking[pokemon.id] = (battleTracking[pokemon.id] || 0) + 1;
    });

    localStorage.setItem('pokemon-battle-tracking', JSON.stringify(battleTracking));
    localStorage.setItem('pokemon-battle-count', (battlesCount + 1).toString());

    console.log(`✅ Created battle with: ${battlePokemon.map(p => p.name).join(', ')}`);
    return battlePokemon;
  };

  return {
    createBattle,
    resetSuggestionPriority,
    startNewBattle,
    trackLowerTierLoss: (loserId: number) => {
      // Implementation for tracking lower tier losses
      console.log(`Tracking lower tier loss for Pokemon ID: ${loserId}`);
    }
  };
}
