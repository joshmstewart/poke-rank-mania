
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStarterMemory } from "./useBattleStarterMemory";
import { useBattleStarterSelection } from "./useBattleStarterSelection";
import { useBattleStarterValidation } from "./useBattleStarterValidation";

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
  const battlesCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
  
  console.log(`🎯 [POKEMON_RANGE_FIX] Battle starter created with ${allPokemon.length} total Pokemon`);
  console.log(`🎯 [POKEMON_RANGE_FIX] Pokemon ID range: ${Math.min(...allPokemon.map(p => p.id))} to ${Math.max(...allPokemon.map(p => p.id))}`);

  const memory = useBattleStarterMemory();
  const selection = useBattleStarterSelection(allPokemon, currentRankings);
  const validation = useBattleStarterValidation(allPokemon);

  // Add event listener for suggestion priority reset
  window.addEventListener("prioritizeSuggestions", () => {
    selection.resetSuggestionPriority();
  });

  const createBattle = (
    battleType: BattleType,
    onMarkSuggestionUsed?: (pokemonId: number) => void
  ): Pokemon[] => {
    const battleSize = battleType === "triplets" ? 3 : 2;
    const availablePokemon = allPokemon;
    
    console.log(`🎮 [BATTLE_REPEAT_DEBUG] Starting battle creation for ${battleType} battle #${battlesCount + 1}`);
    console.log(`🎮 [BATTLE_REPEAT_DEBUG] Available Pokemon pool: ${availablePokemon.length}`);
    console.log(`🎮 [BATTLE_REPEAT_DEBUG] Recent pairs in memory: ${memory.lastBattlePairs.size}`);
    console.log(`🎮 [BATTLE_REPEAT_DEBUG] Recently seen Pokemon: ${memory.recentlySeenPokemon.size}`);
    
    // Clear previous battle state
    memory.clearPreviousBattleState();
    
    // Filter candidate Pokemon
    const candidatePokemon = validation.filterCandidatePokemon(
      availablePokemon, 
      memory.recentlySeenPokemon, 
      battleSize
    );

    let battlePokemon: Pokemon[] = [];
    let attempts = 0;
    const maxAttempts = 10;

    // Try multiple times to avoid repeated battle pairs
    while (attempts < maxAttempts) {
      battlePokemon = [];
      
      // Try suggestion-based selection first
      const suggestionBattle = selection.selectWithSuggestions(
        battleSize, 
        candidatePokemon, 
        onMarkSuggestionUsed
      );
      
      if (suggestionBattle.length > 0) {
        battlePokemon = suggestionBattle;
      } else {
        // Use weighted selection
        const weightedCandidates = selection.createWeightedCandidates(
          candidatePokemon,
          memory.recentlySeenPokemon,
          memory.battleTracking
        );
        
        battlePokemon = selection.selectWeightedPokemon(weightedCandidates, battleSize);
      }

      // Check if this battle combination was recent
      const battleIds = battlePokemon.map(p => p.id);
      const isRecentBattle = memory.isPairRecent(battleIds);
      
      if (!isRecentBattle || attempts >= maxAttempts - 1) {
        console.log(`🎮 [BATTLE_REPEAT_DEBUG] Battle pair ${battleIds.join('-')} is ${isRecentBattle ? 'RECENT but using anyway (max attempts)' : 'FRESH'} - attempt ${attempts + 1}/${maxAttempts}`);
        break;
      } else {
        console.log(`🔄 [BATTLE_REPEAT_DEBUG] Battle pair ${battleIds.join('-')} was recent, trying again (attempt ${attempts + 1}/${maxAttempts})`);
        attempts++;
      }
    }

    // Validate the battle
    if (!validation.validateBattle(battlePokemon, battleSize)) {
      return [];
    }

    // Track battle participation and pair
    const battleIds = battlePokemon.map(p => p.id);
    memory.addBattlePair(battleIds);
    
    console.log(`✅ [BATTLE_REPEAT_DEBUG] Successfully created battle: [${battleIds.join(', ')}] after ${attempts + 1} attempts`);
    console.log(`✅ [BATTLE_REPEAT_DEBUG] Pokemon names: [${battlePokemon.map(p => p.name).join(', ')}]`);
    
    // Log type data and track Pokemon
    validation.logPokemonTypeData(battlePokemon);
    
    battlePokemon.forEach(pokemon => {
      memory.addToRecentlySeen(pokemon.id);
      memory.battleTracking[pokemon.id] = (memory.battleTracking[pokemon.id] || 0) + 1;
    });

    localStorage.setItem('pokemon-battle-tracking', JSON.stringify(memory.battleTracking));
    localStorage.setItem('pokemon-battle-count', (battlesCount + 1).toString());

    return battlePokemon;
  };

  const startNewBattle = (battleType: BattleType, forceSuggestion?: boolean, forceUnranked?: boolean): Pokemon[] => {
    console.log(`🚀 [BATTLE_REPEAT_DEBUG] startNewBattle called for ${battleType}`);
    return createBattle(battleType);
  };

  return {
    createBattle,
    resetSuggestionPriority: selection.resetSuggestionPriority,
    startNewBattle,
    trackLowerTierLoss: (loserId: number) => {
      console.log(`Tracking lower tier loss for Pokemon ID: ${loserId}`);
    }
  };
}
